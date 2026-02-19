import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Edit2, Trash2, FileText, 
  HelpCircle, BookOpen, Layers, Globe, Filter,
  X, ChevronRight, ChevronLeft, Download, Sparkles, Cpu, Save, RefreshCw,
  Eye, ChevronDown, ChevronUp, Check, Play, ExternalLink, Settings
} from 'lucide-react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import AutocompleteSelect from '../components/AutocompleteSelect';
import PdfViewer from '../components/PdfViewer';
import ContentTypeManager from '../components/ContentTypeManager';
import ContentPreview from '../components/ContentPreview';
import './ContentPage.css';

const ContentPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('exams');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState({ universities: [], courses: [], departments: [], topics: [], fields: [], contentTypes: [] });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showContentTypeManager, setShowContentTypeManager] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    universityId: '',
    topicId: '',
    price: 0,
    isFree: false,
    // Exam specific
    duration: 60,
    totalMarks: 100,
    examType: 'other',
    contentTypeId: '',
    questions: [], // Nested questions
    // File specific
    fileName: '',
    originalName: '',
    filePath: '',
    fileType: 'pdf',
    // Note specific
    content: '',
    author: '',
    // Video specific
    url: ''
  });

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadDestination, setUploadDestination] = useState('local');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [githubRepos, setGithubRepos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Manage preview URL lifecycle
  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      return;
    }

    // If it's a local File object
    if (previewFile instanceof File) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } 
    
    // If it's an existing file URL (string or object with url property)
    const existingUrl = typeof previewFile === 'string' ? previewFile : previewFile.url || previewFile.filePath;
    if (existingUrl) {
      // For GitHub or external URLs, we might need to handle them here if they aren't direct
      setPreviewUrl(existingUrl);
    }
  }, [previewFile]);


  // AI Generation State
  const [aiContent, setAiContent] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIArea, setShowAIArea] = useState(false);
  const [creationMode, setCreationMode] = useState('manual'); // 'manual', 'json', 'ai'
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiError, setAiError] = useState('');
  const [viewingFile, setViewingFile] = useState(null);
  const [jsonInputValue, setJsonInputValue] = useState('');
  const [flatJsonInputValue, setFlatJsonInputValue] = useState('');
  const GEMINI_API_KEY = 'AIzaSyAsSx4wDz1_5TYdgzw64ar50TbiRI6OBiQ';

  // Autocomplete State
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [questionTopicOptions, setQuestionTopicOptions] = useState([]);
  const [universityOptions, setUniversityOptions] = useState([]);
  const [contentTypeOptions, setContentTypeOptions] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingContentTypes, setLoadingContentTypes] = useState(false);

  // Inline Editing State (Multi-row support)
  const [editingRows, setEditingRows] = useState(new Set()); // Set of IDs being edited
  const [editedData, setEditedData] = useState({}); // Object keyed by exam ID: { examId: { title, price, isFree } }
  const [isSaving, setIsSaving] = useState(false); // Loading state during save
  const [showContentPreview, setShowContentPreview] = useState(false); // Content preview for notes
  const [previewingNote, setPreviewingNote] = useState(null); // Note being previewed in modal

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAIFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAiFile(file);
    }
  };

  // Drafting Logic
  useEffect(() => {
    if (showModal && !editingItem) {
      const draft = localStorage.getItem('exam_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (window.confirm('You have an unsaved draft. Would you like to restore it?')) {
            setFormData(parsed);
          } else {
            localStorage.removeItem('exam_draft');
          }
        } catch (e) {
          console.error('Failed to parse draft');
        }
      }
    }
  }, [showModal, editingItem]);

  useEffect(() => {
    if (showModal && !editingItem && activeTab === 'exams') {
      localStorage.setItem('exam_draft', JSON.stringify(formData));
    }
  }, [formData, showModal, activeTab]);

  const handleAIGenerate = async () => {
    if (!aiContent.trim() && !aiFile) {
      addToast('error', 'Please provide either text content or a file');
      return;
    }

    setIsGeneratingAI(true);
    setAiError("");
    try {
      let prompt = `
        You are an expert exam creator. Given the provided content (text and/or file), generate 5-10 high-quality multiple choice questions.
        If a file is provided, analyze its content thoroughly. If text is provided, use it as additional context or instructions.
        Return ONLY a JSON array of objects with the following structure:
        [
          {
            "questionText": "string",
            "questionType": "multiple_choice",
            "marks": 1,
            "explanation": "string explaining the answer",
            "choices": [
              { "choiceText": "string", "isCorrect": boolean },
              ... (exactly 4 choices)
            ]
          }
        ]
      `;

      if (aiContent) {
        prompt += `\n\nAdditional Instructions/Context:\n${aiContent}`;
      }

      const contents = [];
      const parts = [{ text: prompt }];

      if (aiFile) {
        const base64Data = await fileToBase64(aiFile);
        parts.push({
          inline_data: {
            mime_type: aiFile.type,
            data: base64Data
          }
        });
      }

      contents.push({ parts });

      let attempts = 0;
      const maxAttempts = 4;
      let response;

      while (attempts < maxAttempts) {
        // Use gemini-1.5-flash which is generally more stable for free tiers
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.8,
              topK: 32,
              topP: 1.0,
              maxOutputTokens: 8192,
            }
          })
        });

        if (response.status === 429) {
          attempts++;
          if (attempts < maxAttempts) {
            const waitTime = Math.pow(2, attempts) * 1000; // Exponential backoff: 2s, 4s, 8s
            addToast('info', `Rate limit hit. Retrying in ${waitTime/1000}s... (Attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          addToast('error', 'API Rate limit exceeded after multiple retries. Please wait a minute before trying again.');
          return;
        }
        break;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // Robust JSON extraction using regex from snippet
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedQuestions = JSON.parse(jsonMatch[0]);
          
          // Map to internal format if needed (though our prompt already asks for correct format)
          const questions = parsedQuestions.map(q => ({
            questionText: q.questionText || q.question || "",
            questionType: "multiple_choice",
            marks: q.marks || 1,
            explanation: q.explanation || "",
            choices: (q.choices || []).map(c => ({
              choiceText: c.choiceText || c.text || "",
              isCorrect: !!c.isCorrect
            }))
          }));

          setAiGeneratedQuestions(questions);
          setShowAiPreview(true);
        } else {
          throw new Error('Valid JSON array not found in AI response');
        }
      } else {
        throw new Error('No candidates returned from Gemini');
      }
    } catch (error) {
      console.error('AI Processing Error:', error);
      // Fallback to manual parsing if API fails
      await generateQuestionsFallback();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateQuestionsFallback = async () => {
    const questions = [];
    
    // Check if the text already contains numbered questions
    const questionPattern = /(\d+\.\s+.*?)(?=\d+\.|$)/gs;
    const matches = aiContent.match(questionPattern);
    
    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        const lines = match.trim().split('\n');
        const questionText = lines[0].replace(/^\d+\.\s*/, '').trim();
        
        if (questionText) {
          const choices = [];
          let correctAnswer = '';
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.match(/^\([a-d]\)/)) {
              const choiceText = line.replace(/^\([a-d]\)\s*/, '').trim();
              choices.push({
                choiceText: choiceText,
                isCorrect: false
              });
            } else if (line.toLowerCase().startsWith('answer:')) {
              const answerMatch = line.match(/\(([a-d])\)/);
              if (answerMatch) correctAnswer = answerMatch[1].toLowerCase();
            }
          }
          
          if (correctAnswer && choices.length > 0) {
            const correctIndex = correctAnswer.charCodeAt(0) - 97;
            if (correctIndex >= 0 && correctIndex < choices.length) {
              choices[correctIndex].isCorrect = true;
            }
          }
          
          if (choices.length >= 2) {
            questions.push({
              id: Date.now() + index,
              questionText: questionText,
              questionType: "multiple_choice",
              marks: 1,
              choices: choices,
              explanation: `Extracted from text`,
              expanded: true
            });
          }
        }
      });
    }
    
    // If no questions were parsed, generate basic placeholders from sentences
    if (questions.length === 0) {
      const sentences = aiContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const numQuestions = Math.min(Math.max(3, Math.floor(sentences.length / 2)), 5);
      
      for (let i = 0; i < numQuestions; i++) {
        const sentence = sentences[i]?.trim();
        if (sentence) {
          questions.push({
            id: Date.now() + i,
            questionText: `Based on: "${sentence.substring(0, 50)}..." what is the main point?`,
            questionType: "multiple_choice",
            marks: 1,
            choices: [
              { choiceText: "Option 1 (Correct)", isCorrect: true },
              { choiceText: "Option 2", isCorrect: false },
              { choiceText: "Option 3", isCorrect: false },
              { choiceText: "Option 4", isCorrect: false }
            ],
            explanation: `Generated from sentence extraction.`,
            expanded: true
          });
        }
      }
    }
    
    if (questions.length > 0) {
      setAiGeneratedQuestions(questions);
      setShowAiPreview(true);
    } else {
      addToast('error', 'Could not find or generate any questions from the content.');
    }
  };

  const acceptAiQuestions = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, ...aiGeneratedQuestions]
    }));
    setShowAiPreview(false);
    setAiGeneratedQuestions([]);
    addToast('success', `Added ${aiGeneratedQuestions.length} questions to the exam!`);
  };

  const editAiQuestion = (questionId, field, value) => {
    setAiGeneratedQuestions(prev => 
      prev.map(q => q.id === questionId ? { ...q, [field]: value } : q)
    );
  };

  const editAiChoice = (questionId, choiceIndex, field, value) => {
    setAiGeneratedQuestions(prev => 
      prev.map(q => {
        if (q.id === questionId) {
          const newChoices = [...q.choices];
          newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
          // If setting isCorrect to true, set others to false
          if (field === 'isCorrect' && value === true) {
            newChoices.forEach((c, idx) => { if (idx !== choiceIndex) c.isCorrect = false; });
          }
          return { ...q, choices: newChoices };
        }
        return q;
      })
    );
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInputValue);
      const questions = Array.isArray(parsed) ? parsed : [parsed];
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...questions]
      }));
      setJsonInputValue('');
      setCreationMode('manual');
      addToast('success', `Imported ${questions.length} questions from JSON`);
    } catch (e) {
      addToast('error', 'Invalid JSON format');
    }
  };

  const handleFlatJsonImport = () => {
    try {
      const parsed = JSON.parse(flatJsonInputValue);
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");
      
      const questionMap = {};
      parsed.forEach(item => {
        const qId = item.question_id;
        if (!questionMap[qId]) {
          questionMap[qId] = {
            id: Date.now() + Math.random(),
            questionText: item.question_content,
            questionType: 'multiple_choice',
            marks: 1,
            explanation: '',
            choices: []
          };
        }
        questionMap[qId].choices.push({
          choiceText: item.choice_content,
          isCorrect: item.isCorrect === 1 || item.isCorrect === true
        });
      });
      
      const newQuestions = Object.values(questionMap);
      if (newQuestions.length === 0) throw new Error("No questions found in data");

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...newQuestions]
      }));
      setFlatJsonInputValue('');
      setCreationMode('manual');
      addToast('success', `Imported ${newQuestions.length} questions from Flat JSON`);
    } catch (e) {
      addToast('error', 'Flat JSON Import Error: ' + e.message);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchGitHubRepos();
    fetchDepartments(); // Load departments on mount
    fetchUniversities(); // Load universities on mount
  }, []);

  useEffect(() => {
    // Reset to first page when changing tabs to ensure we see the latest 5 items
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchData(1);
    }
  }, [activeTab]);

  // Fetch fields when department changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchFields(formData.departmentId);
    } else {
      setFieldOptions([]);
    }
  }, [formData.departmentId]);

  // Fetch courses when field changes
  useEffect(() => {
    if (formData.fieldId) {
      fetchCourses(formData.fieldId);
    } else {
      setCourseOptions([]);
    }
  }, [formData.fieldId]);

  // Fetch topics when course changes
  useEffect(() => {
    if (formData.courseId) {
      fetchTopics(formData.courseId);
    } else {
      setTopicOptions([]);
    }
  }, [formData.courseId]);

  const fetchMetadata = async () => {
    try {
      const response = await API.get(ROUTES.ADMIN.METADATA);
      setMetadata(response.data);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  // Autocomplete Data Fetching Functions
  const fetchDepartments = useCallback(async (searchTerm = '') => {
    setLoadingDepartments(true);
    try {
      const response = await API.get(ROUTES.ADMIN.DEPARTMENTS, {
        params: { search: searchTerm, limit: 100 }
      });
      const departments = response.data.data || response.data || [];
      setDepartmentOptions(departments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartmentOptions([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const fetchFields = useCallback(async (departmentId, searchTerm = '') => {
    if (!departmentId) {
      setFieldOptions([]);
      return;
    }
    
    setLoadingFields(true);
    try {
      const response = await API.get(ROUTES.ADMIN.FIELDS, {
        params: { departmentId, search: searchTerm, limit: 100 }
      });
      const fields = response.data.data || response.data || [];
      setFieldOptions(fields);
    } catch (error) {
      console.error('Failed to fetch fields:', error);
      setFieldOptions([]);
    } finally {
      setLoadingFields(false);
    }
  }, []);

  const fetchCourses = useCallback(async (fieldId, searchTerm = '') => {
    if (!fieldId) {
      setCourseOptions([]);
      return;
    }
    
    setLoadingCourses(true);
    try {
      const response = await API.get(ROUTES.ADMIN.COURSES, {
        params: { fieldId, search: searchTerm, limit: 100 }
      });
      const courses = response.data.data || response.data || [];
      setCourseOptions(courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourseOptions([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const fetchTopics = useCallback(async (contextId, searchTerm = '', type = 'chapter') => {
    // contextId can be courseId
    if (!contextId && type !== 'topic_general') {
      setTopicOptions([]);
      return;
    }
    
    setLoadingTopics(true);
    try {
      const response = await API.get(ROUTES.ADMIN.TOPICS, {
        params: { 
          courseId: contextId, 
          search: searchTerm, 
          limit: 100 
        }
      });
      const topics = response.data.data || response.data || [];
      
      // Still need some client-side filtering because the server might not filter by type in the way we want
      let filtered = topics;
      
      if (type === 'chapter') {
        filtered = filtered.filter(t => t.type === 'chapter');
      } else if (type === 'topic' || type === 'topic_general') {
        filtered = filtered.filter(t => t.type === 'topic');
      }

      if (type === 'chapter') {
        setTopicOptions(filtered);
      } else {
        setQuestionTopicOptions(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      if (type === 'chapter') {
        setTopicOptions([]);
      } else {
        setQuestionTopicOptions([]);
      }
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  const fetchUniversities = useCallback(async (searchTerm = '') => {
    setLoadingUniversities(true);
    try {
      const response = await API.get(ROUTES.ADMIN.UNIVERSITIES, {
        params: { search: searchTerm, limit: 100 }
      });
      const universities = response.data.data || response.data || [];
      setUniversityOptions(universities);
    } catch (error) {
      console.error('Failed to fetch universities:', error);
      setUniversityOptions([]);
    } finally {
      setLoadingUniversities(false);
    }
  }, []);

  const fetchContentTypes = useCallback(async (searchTerm = '') => {
    setLoadingContentTypes(true);
    try {
      const response = await API.get(ROUTES.ADMIN.CONTENT_TYPES, {
        params: { search: searchTerm, limit: 100 }
      });
      const types = response.data.data || response.data || [];
      setContentTypeOptions(types);
    } catch (error) {
      console.error('Failed to fetch content types:', error);
      setContentTypeOptions([]);
    } finally {
      setLoadingContentTypes(false);
    }
  }, []);

  // Stable Search Handlers for AutocompleteSelect
  const handleDepartmentSearch = useCallback((term) => {
    fetchDepartments(term);
  }, [fetchDepartments]);

  const handleFieldSearch = useCallback((term) => {
    if (formData.departmentId) {
      fetchFields(formData.departmentId, term);
    }
  }, [fetchFields, formData.departmentId]);

  const handleCourseSearch = useCallback((term) => {
    if (formData.fieldId) {
      fetchCourses(formData.fieldId, term);
    }
  }, [fetchCourses, formData.fieldId]);

  const handleTopicSearch = useCallback((term) => {
    if (formData.courseId) {
      fetchTopics(formData.courseId, term);
    }
  }, [fetchTopics, formData.courseId]);

  const handleUniversitySearch = useCallback((term) => {
    fetchUniversities(term);
  }, [fetchUniversities]);

  const handleContentTypeSearch = useCallback((term) => {
    fetchContentTypes(term);
  }, [fetchContentTypes]);

  const fetchGitHubRepos = async () => {
    try {
      const response = await API.get(ROUTES.ADMIN.GITHUB_REPOS);
      setGithubRepos(response.data.repos);
      if (response.data.repos.length > 0) {
        setSelectedRepo(response.data.repos[0]);
      }
    } catch (error) {
      console.error('Failed to fetch GitHub repos:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Wrap files with metadata for UI
      const newFiles = files.map(f => ({
        file: f,
        customName: f.name.split('.')[0] || f.name, // Prepopulate with name without extension
        id: Date.now() + Math.random()
      }));
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Legacy support for single file edit (optional, but let's keep it clean)
      // If we are just adding files, we don't necessarily need to touch formData.title immediately unless it's strictly single file mode.
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateFileName = (index, newName) => {
    setSelectedFiles(prev => prev.map((item, i) => i === index ? { ...item, customName: newName } : item));
  };

  const handlePreview = (file) => {
    // If clicking the same file, close the preview
    const isSameFile = previewFile === file || (previewFile?.name && previewFile.name === file.name);
    
    if (isSameFile) {
      setPreviewFile(null);
    } else {
      setPreviewFile(file);
    }
  };

    const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      addToast('error', 'Please select a file first');
      return;
    }

    if (uploadDestination === 'github' && !selectedRepo) {
      addToast('error', 'Please select a GitHub repository');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      // backend expects 'file' (upload.array('file'))
      selectedFiles.forEach(item => {
        formDataToSend.append('file', item.file);
      });
      
      formDataToSend.append('destination', uploadDestination);
      if (uploadDestination === 'github') {
        formDataToSend.append('repo', selectedRepo);
      }

      const response = await API.post(ROUTES.ADMIN.UPLOAD_FILE, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        // Backend returns { files: [{ url, filename }, ...] }
        const uploaded = response.data.files || [];
        
        // Map uploaded files back to our selectedFiles to preserve custom names
        // Assuming order is preserved (standard for array uploads)
        const finalizedFiles = uploaded.map((upFile, idx) => ({
          ...upFile,
          customName: selectedFiles[idx]?.customName || upFile.filename
        }));
        
        // Store uploaded files in a temp state or inside formData?
        // Let's store in formData as a new property for bulk creation
        setFormData(prev => ({ 
          ...prev, 
          uploadedFiles: finalizedFiles,
          // Legacy/Single file fallback
          filePath: finalizedFiles.length === 1 ? finalizedFiles[0].url : prev.filePath,
          fileName: finalizedFiles.length === 1 ? finalizedFiles[0].customName : prev.fileName
        }));

        addToast('success', `${uploaded.length} Files uploaded successfully!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast('error', 'Failed to upload file: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchData = async (page = currentPage) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'exams') endpoint = ROUTES.ADMIN.EXAMS;
      else if (activeTab === 'files') endpoint = ROUTES.ADMIN.FILES;
      else if (activeTab === 'notes') endpoint = ROUTES.ADMIN.SHORT_NOTES;
      else if (activeTab === 'videos') endpoint = ROUTES.ADMIN.VIDEOS;
      
      const response = await API.get(endpoint, {
        params: { page, limit, search }
      });
      
      const result = response.data.data || response.data;
      setData(Array.isArray(result) ? result : []);
      setTotalPages(response.data.pages || 1);
      setTotalItems(response.data.total || result.length || 0);
      setCurrentPage(response.data.currentPage || page);
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchData(newPage);
  };

  // Trigger search fetch after delay
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (loading) return; // Prevent double fetch on initial load
      fetchData(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [coursesRes, topicsRes, unisRes, deptsRes, fieldsRes] = await Promise.all([
          API.get(ROUTES.ADMIN.COURSES),
          API.get(ROUTES.ADMIN.TOPICS),
          API.get(ROUTES.ADMIN.UNIVERSITIES),
          API.get(ROUTES.ADMIN.DEPARTMENTS),
          API.get(ROUTES.ADMIN.FIELDS)
        ]);
        
        setMetadata({
          courses: coursesRes.data.data || coursesRes.data || [],
          topics: topicsRes.data.data || topicsRes.data || [],
          universities: unisRes.data.data || unisRes.data || [],
          departments: deptsRes.data.data || deptsRes.data || [],
          fields: fieldsRes.data.data || fieldsRes.data || []
        });
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    
    fetchMetadata();
    fetchContentTypes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    
    try {
      let endpoint = '';
      if (activeTab === 'exams') endpoint = ROUTES.ADMIN.DELETE_EXAM(id);
      else if (activeTab === 'files') endpoint = ROUTES.ADMIN.DELETE_FILE(id);
      else if (activeTab === 'notes') endpoint = ROUTES.ADMIN.DELETE_SHORT_NOTE(id);
      else if (activeTab === 'videos') endpoint = ROUTES.ADMIN.DELETE_VIDEO(id);
      
      await API.delete(endpoint);
      addToast('success', `${activeTab.slice(0, -1)} deleted successfully`);
      fetchData();
    } catch (error) {
      addToast('error', 'Failed to delete item');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setSelectedFiles([]); // Reset files
    setFormData({
      title: '', description: '', courseId: '', universityId: '', 
      departmentId: '', fieldId: '', topicId: '', price: 0, isFree: true, duration: 60, 
      totalMarks: 100, examType: 'other', questions: [],
      fileName: '', originalName: '', filePath: '', fileType: 'pdf', 
      content: '', author: '', url: ''
    });
    // Reset autocomplete options
    setFieldOptions([]);
    setCourseOptions([]);
    setTopicOptions([]);
    // Refresh departments to ensure all are loaded
    fetchDepartments();
    setShowModal(true);
    setPreviewFile(null);
  };

  const openEditModal = async (item) => {
    setEditingItem(item);
    setSelectedFiles([]); // Reset files
    setShowModal(true);
    setPreviewFile(null);
    
    // Initial form set with basic data from the list
    const initialFormData = {
      ...item,
      title: item.title || item.fileName || '',
      courseId: item.courseId || '',
      universityId: item.universityId || '',
      departmentId: item.departmentId || '',
      fieldId: item.fieldId || '',
      topicId: item.topicId || '',
      url: item.url || '',
      questions: item.questions || []
    };
    setFormData(initialFormData);

    // If it's an exam, fetch full details on demand (lazy loading)
    if (activeTab === 'exams') {
      setIsLoadingDetails(true);
      try {
        const response = await API.get(ROUTES.ADMIN.EXAM_DETAILS(item.id));
        const fullExam = response.data.data || response.data;
        if (fullExam) {
          setFormData(prev => ({
            ...prev,
            questions: fullExam.questions || []
          }));
        }
      } catch (error) {
        console.error('Failed to fetch exam details:', error);
        addToast('error', 'Failed to load full exam details');
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  // Hierarchical change handlers
  const handleDepartmentChange = (value) => {
    setFormData({
      ...formData,
      departmentId: value,
      fieldId: '', // Reset field
      courseId: '', // Reset course
      topicId: '' // Reset topic
    });
  };

  const handleFieldChange = (value) => {
    setFormData({
      ...formData,
      fieldId: value,
      courseId: '', // Reset course
      topicId: '' // Reset topic
    });
  };

  const handleCourseChange = (value) => {
    setFormData({
      ...formData,
      courseId: value,
      topicId: '' // Reset topic
    });
  };

  const handleTopicChange = (value) => {
    setFormData({
      ...formData,
      topicId: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let endpoint = '';
      const method = editingItem ? 'put' : 'post';
      
      const payload = { ...formData };
      // Convert empty strings to null for ID fields
      if (!payload.universityId) payload.universityId = null;
      if (!payload.courseId) payload.courseId = null;
      if (!payload.departmentId) payload.departmentId = null;
      if (!payload.fieldId) payload.fieldId = null;
      if (!payload.topicId) payload.topicId = null;
      if (!payload.price) payload.price = 0; // Ensure price is number
      
      if (activeTab === 'exams') {
        endpoint = editingItem ? ROUTES.ADMIN.UPDATE_EXAM(editingItem.id) : ROUTES.ADMIN.CREATE_EXAM;
      } else if (activeTab === 'files') {
        const payload = {
          ...formData,
          // Re-apply null checks for payload if they were stripped? 
          // The keys are already processed above, so 'payload' is good to use as base, 
          // but we need to ensure we don't send 'uploadedFiles' if we are doing single update
        };
        // Convert empty strings to null for ID fields (already done above in 'payload' construction)

        if (editingItem) {
           endpoint = ROUTES.ADMIN.UPDATE_FILE(editingItem.id);
        } else {
             // Handle bulk creation for files
            if (activeTab === 'files' && selectedFiles.length > 0) {
              // Upload Logic
              const formDataToSend = new FormData();
              selectedFiles.forEach(item => {
                formDataToSend.append('file', item.file);
              });
              
              formDataToSend.append('destination', uploadDestination);
              if (uploadDestination === 'github') {
                if (!selectedRepo) {
                    addToast('error', 'Please select a GitHub repository');
                    setIsSubmitting(false);
                    return;
                }
                formDataToSend.append('repo', selectedRepo);
              }

              // Perform Upload
              const uploadResponse = await API.post(ROUTES.ADMIN.UPLOAD_FILE, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                  const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  setUploadProgress(percentCompleted);
                }
              });

              if (uploadResponse.data.success) {
                const uploaded = uploadResponse.data.files || [];
                
                const promises = uploaded.map((upFile, idx) => {
                     const customName = selectedFiles[idx]?.customName || upFile.filename;
                     const singleFilePayload = {
                      ...payload,
                      fileName: customName, 
                      originalName: upFile.filename,
                      filePath: upFile.url
                    };
                    return API.post(ROUTES.ADMIN.CREATE_FILE, singleFilePayload);
                });
                
                await Promise.all(promises);
                setShowModal(false);
                fetchData();
                addToast('success', `${uploaded.length} files saved successfully`);
                setIsSubmitting(false);
                setUploadProgress(0);
                return; 
              } else {
                  throw new Error(uploadResponse.data.message || 'Upload failed');
              }
            } else {
                 addToast('error', 'Please select at least one file.');
                 setIsSubmitting(false);
                 return; 
            }
        }
      } else if (activeTab === 'notes') {
        endpoint = editingItem ? ROUTES.ADMIN.UPDATE_SHORT_NOTE(editingItem.id) : ROUTES.ADMIN.CREATE_SHORT_NOTE;
      } else if (activeTab === 'videos') {
        endpoint = editingItem ? ROUTES.ADMIN.UPDATE_VIDEO(editingItem.id) : ROUTES.ADMIN.CREATE_VIDEO;
      }

      
      // Strip temporary IDs from questions for new exams or new questions
      if (payload.questions) {
        payload.questions = payload.questions.map(q => {
          const { id, ...rest } = q; // Remove ID
          // Also strip IDs from choices if they are temporary (frontend generated)
          const choices = rest.choices.map(c => {
             const { id: cId, ...cRest } = c;
             return cRest;
          });
          return { ...rest, choices };
        });
      }

      await API[method](endpoint, payload);
      setShowModal(false);
      fetchData();
      addToast('success', `${activeTab.slice(0, -1)} saved successfully`);
    } catch (error) {
      console.error('Save error:', error);
      addToast('error', error.response?.data?.message || 'Failed to save content');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Question Management
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          questionType: 'multiple_choice',
          marks: 1,
          explanation: '',
          topicId: '',
          choices: [
            { choiceText: '', isCorrect: true },
            { choiceText: '', isCorrect: false }
          ]
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addChoice = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].choices.push({ choiceText: '', isCorrect: false });
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeChoice = (qIndex, cIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].choices.splice(cIndex, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateChoice = (qIndex, cIndex, field, value) => {
    const newQuestions = [...formData.questions];
    if (field === 'isCorrect' && value === true) {
      // Toggle others off for single correct answer
      newQuestions[qIndex].choices.forEach((c, idx) => c.isCorrect = idx === cIndex);
    } else {
      newQuestions[qIndex].choices[cIndex][field] = value;
    }
    setFormData({ ...formData, questions: newQuestions });
  };

  // Inline Editing Handlers
  const handleDoubleClick = (item) => {
    if (activeTab !== 'exams' || isSaving) return; // Only for exams tab
    
    // Add to editing set
    setEditingRows(prev => new Set([...prev, item.id]));
    
    // Initialize data for this exam if not already present
    if (!editedData[item.id]) {
      setEditedData(prev => ({
        ...prev,
        [item.id]: {
          title: item.title || '',
          price: item.price || 0,
          isFree: item.isFree || false,
          contentTypeId: item.contentTypeId || ''
        }
      }));
    }
  };

  const handleInlineEdit = (examId, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [examId]: {
        ...prev[examId],
        [field]: value,
        ...(field === 'price' && { isFree: value == 0 })
      }
    }));
  };

  const handleCancelEdit = (examId) => {
    // Remove from editing set
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(examId);
      return newSet;
    });
    
    // Remove edited data for this exam
    setEditedData(prev => {
      const newData = { ...prev };
      delete newData[examId];
      return newData;
    });
  };

  const handleSaveAll = async () => {
    if (Object.keys(editedData).length === 0 || isSaving) return;
    
    setIsSaving(true);
    const examIds = Object.keys(editedData);
    let successCount = 0;
    let failCount = 0;

    try {
      // Save exams in batches to avoid connection pool exhaustion
      const BATCH_SIZE = 3; // Limit concurrent requests
      
      for (let i = 0; i < examIds.length; i += BATCH_SIZE) {
        const batch = examIds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (examId) => {
          try {
            await API.put(ROUTES.ADMIN.UPDATE_EXAM(examId), editedData[examId]);
            successCount++;
          } catch (error) {
            console.error(`Failed to save exam ${examId}:`, error);
            failCount++;
          }
        });
        
        await Promise.all(batchPromises);
      }

      // Show results
      if (successCount > 0) {
        addToast('success', `${successCount} exam(s) updated successfully`);
      }
      if (failCount > 0) {
        addToast('error', `Failed to update ${failCount} exam(s)`);
      }

      // Reset editing state
      setEditingRows(new Set());
      setEditedData({});

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Bulk save error:', error);
      addToast('error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };






  return (
    <div className="page-container content-page">
      {/* ... (header and tabs remain same) */}
      <div style={{ height: '1rem' }}></div> {/* Spacer replacing header */}

      <div className="tabs-container">
        <div className={`tab ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
          <HelpCircle size={18} />
          <span>Exams</span>
        </div>
        <div className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
          <Download size={18} />
          <span>Files</span>
        </div>
        <div className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          <BookOpen size={18} />
          <span>Short Notes</span>
        </div>
        <div className={`tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
          <Play size={18} />
          <span>Videos</span>
        </div>
      </div>

      <div className="content-toolbar">
        <div className="toolbar-search-group" style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="add-btn toolbar-add-btn" onClick={openAddModal}>
            <Plus size={18} />
            <span>New {activeTab === 'exams' ? 'Exam' : activeTab === 'files' ? 'File' : 'Note'}</span>
          </button>
          <button 
            className="add-btn toolbar-add-btn" 
            onClick={() => setShowContentTypeManager(true)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            title="Manage Content Types"
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="filter-group">
          {/* filters... */}
        </div>
        
        {/* Top Pagination */}
        <div className="top-pagination">
          <div className="pagination-info">
            <span>{(currentPage - 1) * limit + 1}</span>-<span>{Math.min(currentPage * limit, totalItems)}</span>/<span>{totalItems}</span>
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="page-numbers">
              {/* Only show relevant pages if too many */}
              {[...Array(totalPages)].map((_, i) => (
                (i + 1 === 1 || i + 1 === totalPages || Math.abs(currentPage - (i + 1)) <= 1) && (
                  <button 
                    key={i + 1}
                    className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                )
              ))}
            </div>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="content-table-wrapper">
        <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>{activeTab === 'files' ? 'File Name' : activeTab === 'videos' ? 'Title' : 'Title'}</th>
                  {activeTab === 'exams' ? (
                    <>
                      <th>Content Type</th>
                      <th>Field</th>
                      <th>Questions</th>
                    </>
                  ) : (
                    <>
                      <th>Course</th>
                      <th>Date Added</th>
                    </>
                  )}
                  <th>University</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="loading-row">
                      <td colSpan={activeTab === 'exams' ? 6 : 6}>
                        <div className="skeleton-bar"></div>
                      </td>
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'exams' ? 6 : 6} className="empty-state">
                      <FileText size={48} />
                      <p>No content found matching your filters</p>
                    </td>
                  </tr>
                ) : (
                  data.map(item => {
                    const isEditing = editingRows.has(item.id);
                    return (
                  <tr key={item.id}>
                    <td onDoubleClick={() => handleDoubleClick(item)}>
                      <div className="item-title-cell">
                        {activeTab === 'exams' && <HelpCircle size={16} className="item-icon" />}
                        {activeTab === 'files' && <Download size={16} className="item-icon" />}
                        {activeTab === 'notes' && <FileText size={16} className="item-icon" />}
                        {activeTab === 'videos' && <Play size={16} className="item-icon" />}
                        {isEditing && activeTab === 'exams' ? (
                          <input
                            type="text"
                            value={editedData[item.id]?.title || ''}
                            onChange={(e) => handleInlineEdit(item.id, 'title', e.target.value)}
                            style={{ width: '100%', padding: '4px', border: '1px solid var(--primary-color)', opacity: isSaving ? 0.6 : 1 }}
                            autoFocus
                            disabled={isSaving}
                          />
                        ) : (
                          <span>{item.title || item.fileName}</span>
                        )}
                      </div>
                    </td>
                    {activeTab === 'exams' ? (
                      <>
                        <td onDoubleClick={() => handleDoubleClick(item)}>
                          {isEditing ? (
                            <select
                              value={editedData[item.id]?.contentTypeId || ''}
                              onChange={(e) => handleInlineEdit(item.id, 'contentTypeId', e.target.value)}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--primary-color)', opacity: isSaving ? 0.6 : 1 }}
                              disabled={isSaving}
                            >
                              <option value="">Select Content Type</option>
                              {contentTypeOptions.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                              ))}
                            </select>
                          ) : (
                            item.contentType?.name || 'N/A'
                          )}
                        </td>
                        <td>{item.field?.name || 'N/A'}</td>
                        <td>
                          <span className="question-count-badge">
                            {item.questionCount || 0}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.course?.name || 'N/A'}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      </>
                    )}
                    <td>{item.university?.name ? (
                        <span className="uni-badge">{item.university.name}</span>
                      ) : (
                        <span className="general-badge">General</span>
                      )}
                    </td>
                    <td onDoubleClick={() => handleDoubleClick(item)}>
                      {isEditing && activeTab === 'exams' ? (
                        <input
                          type="number"
                          value={editedData[item.id]?.price || 0}
                          onChange={(e) => handleInlineEdit(item.id, 'price', e.target.value)}
                          style={{ width: '80px', padding: '4px', border: '1px solid var(--primary-color)', opacity: isSaving ? 0.6 : 1 }}
                          disabled={isSaving}
                        />
                      ) : (
                        item.isFree ? 'Free' : `${item.price} ETB`
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        {isEditing && activeTab === 'exams' ? (
                          <>
                            <button className="action-btn delete" onClick={() => handleCancelEdit(item.id)} title="Cancel" disabled={isSaving} style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            {activeTab === 'files' && (
                              <button 
                                className="action-btn view" 
                                onClick={() => setViewingFile(item)}
                                title="Open File"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {activeTab === 'notes' && (
                              <button 
                                className="action-btn view" 
                                onClick={() => setPreviewingNote(item)}
                                title="Preview Content"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            <button className="action-btn edit" onClick={() => openEditModal(item)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="action-btn delete" onClick={() => handleDelete(item.id)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                  })
                )}
              </tbody>
            </table>
        </div>
        
        {/* Save All Button - appears when there are changes */}
        {Object.keys(editedData).length > 0 && activeTab === 'exams' && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            padding: '1rem', 
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)'
          }}>
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: isSaving ? 'var(--border-color)' : 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save All ({Object.keys(editedData).length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className={`modal-content ${(activeTab === 'exams' || activeTab === 'files' || activeTab === 'notes') ? 'large-modal' : ''}`} style={previewFile ? { width: '95%', maxWidth: '1400px' } : {}}>
            <div style={{ flex: 1, minWidth: '0', minHeight: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...(previewFile ? { marginRight: '20px' } : {}) }}>
              <div className="modal-header">
                <h2>{editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h2>
                <button className="close-btn" onClick={() => { setShowModal(false); setPreviewFile(null); }}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="content-form">
                <div className="form-main-scroll">
                  <div className="form-grid">
                    {activeTab !== 'files' && (
                      <div className="form-group full-width">
                        <label>Title / Name</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                    )}

                    <div className="metadata-grid full-width" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      {/* Hierarchical Order: Department → Field → Course → Topic */}
                      
                      <AutocompleteSelect
                        label="Department"
                        value={formData.departmentId}
                        onChange={handleDepartmentChange}
                        options={departmentOptions}
                        placeholder="Type to search departments..."
                        loading={loadingDepartments}
                        onSearch={handleDepartmentSearch}
                        required={false}
                      />

                      <AutocompleteSelect
                        label="Field"
                        value={formData.fieldId}
                        onChange={handleFieldChange}
                        options={fieldOptions}
                        placeholder="Select department first..."
                        loading={loadingFields}
                        onSearch={handleFieldSearch}
                        disabled={!formData.departmentId}
                        required={false}
                      />

                      <AutocompleteSelect
                        label="Course"
                        value={formData.courseId}
                        onChange={handleCourseChange}
                        options={courseOptions}
                        placeholder="Select field first..."
                        loading={loadingCourses}
                        onSearch={handleCourseSearch}
                        disabled={!formData.fieldId}
                        required={false}
                      />

                      <AutocompleteSelect
                        label="Topic (Optional)"
                        value={formData.topicId}
                        onChange={handleTopicChange}
                        options={topicOptions}
                        placeholder="Select course first..."
                        loading={loadingTopics}
                        onSearch={handleTopicSearch}
                        disabled={!formData.courseId}
                        required={false}
                      />

                      <AutocompleteSelect
                        label="University (Optional)"
                        value={formData.universityId}
                        onChange={(val) => setFormData({...formData, universityId: val})}
                        options={universityOptions}
                        placeholder="Type to search universities..."
                        loading={loadingUniversities}
                        onSearch={handleUniversitySearch}
                        required={false}
                      />

                      <AutocompleteSelect
                        label="Content Type"
                        value={formData.contentTypeId}
                        onChange={(val) => setFormData({...formData, contentTypeId: val})}
                        options={contentTypeOptions}
                        placeholder="Select content type..."
                        loading={loadingContentTypes}
                        onSearch={handleContentTypeSearch}
                        required={true}
                      />

                      <div className="form-group">
                        <label>Price (ETB)</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value, isFree: e.target.value == 0})}
                        />
                      </div>
                    </div>

                    {activeTab === 'exams' && (
                      <>
                        <div className="form-group">
                          <label>Duration (Min)</label>
                          <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Total Marks</label>
                          <input
                            type="number"
                            value={formData.totalMarks}
                            onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    {activeTab === 'files' && (
                      <>
                        <div className="form-group full-width file-upload-section">
                          <label>Upload File(s)</label>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="file-input"
                          />
                          {selectedFiles.length > 0 && (
                            <div className="selected-files-list">
                              {selectedFiles.map((item, idx) => (
                                <div key={item.id || idx} className="file-selected-item" style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                                  <div style={{flex: 1}}>
                                    <label style={{fontSize: '12px', color: '#666'}}>File Name (Title)</label>
                                    <input
                                      type="text"
                                      value={item.customName}
                                      onChange={(e) => updateFileName(idx, e.target.value)}
                                      placeholder="Enter file name"
                                      style={{width: '100%', padding: '8px', marginTop: '4px'}}
                                    />
                                    <div style={{fontSize: '11px', color: '#888', marginTop: '2px'}}>
                                      Original: {item.file.name} ({(item.file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handlePreview(item.file)}
                                      className="preview-file-btn"
                                      title="Preview PDF"
                                      style={{ background: 'none', border: 'none', color: previewFile === item.file ? 'var(--primary-color)' : '#666', cursor: 'pointer' }}
                                    >
                                      <Eye size={16} />
                                    </button>
                                    <button type="button" onClick={() => removeSelectedFile(idx)} className="remove-file-btn">
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Upload Destination</label>
                          <div className="radio-group">
                            <label>
                              <input
                                type="radio"
                                value="local"
                                checked={uploadDestination === 'local'}
                                onChange={(e) => setUploadDestination(e.target.value)}
                              />
                              Local Server
                            </label>
                            <label>
                              <input
                                type="radio"
                                value="github"
                                checked={uploadDestination === 'github'}
                                onChange={(e) => setUploadDestination(e.target.value)}
                              />
                              GitHub Repository
                            </label>
                          </div>
                        </div>

                        {uploadDestination === 'github' && (
                          <div className="form-group">
                            <label>Select Repository</label>
                            <select
                              value={selectedRepo}
                              onChange={(e) => setSelectedRepo(e.target.value)}
                            >
                              {githubRepos.map(repo => (
                                <option key={repo} value={repo}>{repo}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === 'notes' && (
                      <div className="form-group">
                        <label>Author</label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData({...formData, author: e.target.value})}
                        />
                      </div>
                    )}

                    {activeTab === 'videos' && (
                      <>
                      <div className="form-group full-width">
                        <label>Video URL (YouTube)</label>
                        <input
                          type="url"
                          required
                          placeholder="https://youtube.com/watch?v=..."
                          value={formData.url}
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Content (Markdown/HTML supported)</label>
                        <textarea
                          rows={6}
                          placeholder="Detailed content for the video..."
                          value={formData.content}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
                      </div>
                      </>
                    )}

                    <div className="form-group full-width">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label>{activeTab === 'notes' ? 'Content' : 'Description'}</label>
                        {activeTab === 'notes' && (
                          <button
                            type="button"
                            onClick={() => setShowContentPreview(!showContentPreview)}
                            style={{
                              background: showContentPreview ? 'var(--primary-color)' : 'var(--bg-accent)',
                              color: showContentPreview ? 'white' : 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Eye size={14} />
                            {showContentPreview ? 'Hide Preview' : 'Show Preview'}
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={4}
                        value={activeTab === 'notes' ? formData.content : formData.description}
                        onChange={(e) => setFormData({...formData, [activeTab === 'notes' ? 'content' : 'description']: e.target.value})}
                      />
                      {activeTab === 'notes' && (
                        <ContentPreview 
                          content={formData.content} 
                          show={showContentPreview}
                        />
                      )}
                    </div>
                  </div>

                  {activeTab === 'exams' && (
                    <div className="creation-mode-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem', background: 'var(--bg-accent)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => setCreationMode('manual')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: creationMode === 'manual' ? 'var(--primary-color)' : 'transparent', color: creationMode === 'manual' ? 'white' : 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.2s' }}
                      >
                        Manual Creation
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreationMode('json')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: creationMode === 'json' ? 'var(--primary-color)' : 'transparent', color: creationMode === 'json' ? 'white' : 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.2s' }}
                      >
                        JSON Import
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreationMode('ai')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: creationMode === 'ai' ? 'var(--primary-color)' : 'transparent', color: creationMode === 'ai' ? 'white' : 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Sparkles size={16} />
                        AI Generator
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreationMode('flat_json')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: creationMode === 'flat_json' ? 'var(--primary-color)' : 'transparent', color: creationMode === 'flat_json' ? 'white' : 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.2s' }}
                      >
                        Flat JSON
                      </button>
                    </div>
                  )}

                  {activeTab === 'exams' && creationMode === 'json' && (
                    <div className="json-import-area" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Paste JSON Array</label>
                      <textarea
                        rows={6}
                        placeholder='[{"questionText": "...", "choices": [{"choiceText": "...", "isCorrect": true}, ...]}]'
                        value={jsonInputValue}
                        onChange={(e) => setJsonInputValue(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={handleJsonImport}
                        style={{ marginTop: '1rem', width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 600 }}
                      >
                        Import & Append Questions
                      </button>
                    </div>
                  )}

                  {activeTab === 'exams' && creationMode === 'flat_json' && (
                    <div className="json-import-area" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Paste Flat JSON Array</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Format: {'[{"question_id": 1, "question_content": "...", "choice_content": "...", "isCorrect": 0/1}, ...]'}
                      </p>
                      <textarea
                        rows={6}
                        placeholder='[{"question_id": 1, "question_content": "...", "choice_content": "...", "isCorrect": 1}, ...]'
                        value={flatJsonInputValue}
                        onChange={(e) => setFlatJsonInputValue(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={handleFlatJsonImport}
                        style={{ marginTop: '1rem', width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 600 }}
                      >
                        Import & Append Flat Questions
                      </button>
                    </div>
                  )}

                  {activeTab === 'exams' && creationMode === 'ai' && (
                    <div className="ai-generation-wrapper" style={{ marginBottom: '1.5rem' }}>
                      <div className="ai-content-area" style={{ padding: '1.5rem', background: 'rgba(79, 70, 229, 0.03)', borderRadius: '16px', border: '1.5px dashed var(--primary-color)' }}>
                        {aiError && (
                          <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {aiError}
                          </div>
                        )}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Step 1: Upload a File (PDF, Image, etc.)
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              onChange={handleAIFileSelect}
                              style={{ flex: 1 }}
                            />
                            {aiFile && <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 500 }}>{aiFile.name} ready</div>}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Step 2: Add Instructions or Paste Text (Optional)
                          </label>
                          <textarea
                            rows={6}
                            placeholder="Add specific instructions (e.g. 'focus on mitochondria') or paste additional text..."
                            value={aiContent}
                            onChange={(e) => setAiContent(e.target.value)}
                            style={{ width: '100%', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="ai-action-btn"
                          onClick={handleAIGenerate}
                          disabled={isGeneratingAI}
                          style={{ width: '100%', background: 'var(--primary-gradient)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                          {isGeneratingAI ? (
                            <>
                              <RefreshCw className="spin" size={20} />
                              AI Analyzing...
                            </>
                          ) : (
                            <>
                              <Cpu size={20} />
                              Generate & Preview Questions
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'exams' && creationMode === 'manual' && (
                    <div className="questions-section">
                      <div className="section-header">
                        <h3>Questions & Answers</h3>
                        {!isLoadingDetails && (
                          <button type="button" className="add-question-btn" onClick={addQuestion}>
                            <Plus size={16} />
                            Add Question
                          </button>
                        )}
                      </div>

                      {isLoadingDetails ? (
                        <div className="details-loader" style={{ padding: '40px', textAlign: 'center', color: 'var(--primary-color)' }}>
                          <RefreshCw className="spin" size={32} style={{ marginBottom: '10px' }} />
                          <p>Loading questions & choices...</p>
                        </div>
                      ) : (
                        <div className="questions-list">
                        {formData.questions.map((q, qIdx) => (
                          <div key={qIdx} className="question-card">
                            <div className="question-header">
                              <span className="q-number">Question {qIdx + 1}</span>
                              <button type="button" className="remove-q-btn" onClick={() => removeQuestion(qIdx)}>
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="form-group">
                              <label>Question Text</label>
                              <textarea
                                required
                                value={q.questionText}
                                onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
                              />
                            </div>

                            <div className="q-meta-grid">
                              <AutocompleteSelect
                                label="Topic (Optional)"
                                value={q.topicId}
                                onChange={(val) => updateQuestion(qIdx, 'topicId', val)}
                                options={questionTopicOptions}
                                placeholder="Search topic..."
                                loading={loadingTopics}
                                onSearch={(term) => fetchTopics(formData.courseId, term, 'topic')}
                                disabled={!formData.courseId}
                                required={false}
                              />
                              <div className="form-group">
                                <label>Marks</label>
                                <input
                                  type="number"
                                  value={q.marks}
                                  onChange={(e) => updateQuestion(qIdx, 'marks', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="choices-section">
                              <div className="choices-header">
                                <label>Choices</label>
                                <button type="button" className="add-choice-btn" onClick={() => addChoice(qIdx)}>
                                  <Plus size={14} /> Add Choice
                                </button>
                              </div>
                              {q.choices.map((c, cIdx) => (
                                <div key={cIdx} className="choice-row">
                                  <input
                                    type="radio"
                                    name={`correct-${qIdx}`}
                                    checked={c.isCorrect}
                                    onChange={() => updateChoice(qIdx, cIdx, 'isCorrect', true)}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Choice text..."
                                    value={c.choiceText}
                                    onChange={(e) => updateChoice(qIdx, cIdx, 'choiceText', e.target.value)}
                                    required
                                  />
                                  <button type="button" className="remove-choice-btn" onClick={() => removeChoice(qIdx, cIdx)}>
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="form-group">
                              <label>Answer Explanation</label>
                              <textarea
                                placeholder="Why is this answer correct?"
                                value={q.explanation}
                                onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <div className="footer-left">
                    {editingItem ? null : (
                      <button
                        type="button"
                        className="draft-btn"
                        onClick={() => {
                          localStorage.setItem('exam_draft', JSON.stringify(formData));
                          addToast('success', 'Draft saved locally!');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '10px', color: 'var(--text-secondary)' }}
                      >
                        <Save size={18} />
                        Save Draft
                      </button>
                    )}
                  </div>
                  <div className="footer-right" style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" className="cancel-pill" onClick={() => setShowModal(false)}>Cancel</button>
                    <button
                      type="submit"
                      className="save-pill"
                      disabled={isSubmitting}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="spin" size={18} />
                          {activeTab === 'files' && uploadProgress > 0 && uploadProgress < 100
                            ? `Uploading... ${uploadProgress}%`
                            : 'Saving...'}
                        </>
                      ) : (
                        `Save ${activeTab.slice(0, -1)}`
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Preview Pane */}
            {previewFile && (
              <div className="preview-pane" style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Preview: {previewFile.name || 'File'}
                    </h3>
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary"
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Globe size={14} /> Open in New Tab
                    </a>
                  </div>
                  <button type="button" onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-accent)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', minHeight: '500px', position: 'relative' }}>
                   {previewUrl && (previewFile.type === 'application/pdf' || (typeof previewFile === 'string' && previewFile.endsWith('.pdf'))) ? (
                       <iframe 
                         src={previewUrl} 
                         width="100%" 
                         height="100%" 
                         style={{ border: 'none' }} 
                         title="PDF Preview"
                       />
                   ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '10px' }}>
                         <FileText size={48} opacity={0.3} />
                         <p>Preview not available for this file type</p>
                         {previewUrl && (
                           <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="save-pill" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                             Download/View File
                           </a>
                         )}
                       </div>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAiPreview && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={24} color="var(--primary-color)" />
                <h2>AI Generated Questions Preview</h2>
              </div>
              <button className="close-btn" onClick={() => setShowAiPreview(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="form-main-scroll" style={{ padding: '20px' }}>
              <div className="ai-preview-intro" style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-accent)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Review the questions generated by AI. You can edit the text, change correct answers, or add explanations before accepting them into your exam.
                </p>
              </div>

              <div className="ai-questions-list">
                {aiGeneratedQuestions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="question-card ai-preview-card" style={{ border: '1.5px solid var(--border-color)', position: 'relative' }}>
                    <div className="question-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="q-number">Question {qIdx + 1}</span>
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>AI Generated</span>
                      </div>
                      <button 
                        type="button" 
                        className="toggle-expand-btn"
                        onClick={() => editAiQuestion(q.id, 'expanded', !q.expanded)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        {q.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Question Text</label>
                      <textarea 
                        value={q.questionText}
                        onChange={(e) => editAiQuestion(q.id, 'questionText', e.target.value)}
                        rows={2}
                        style={{ fontSize: '1rem', fontWeight: 500 }}
                      />
                    </div>

                    {q.expanded && (
                      <div className="ai-card-expanded-content" style={{ marginTop: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
                        <div className="choices-section" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)' }}>
                          <div className="choices-header">
                            <label style={{ fontWeight: 600 }}>Choices</label>
                          </div>
                          {q.choices.map((c, cIdx) => (
                            <div key={cIdx} className="choice-row">
                              <div 
                                onClick={() => editAiChoice(q.id, cIdx, 'isCorrect', true)}
                                style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  border: `2px solid ${c.isCorrect ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  background: c.isCorrect ? 'var(--primary-color)' : 'transparent',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {c.isCorrect && <Check size={14} color="white" />}
                              </div>
                              <input 
                                type="text"
                                value={c.choiceText}
                                onChange={(e) => editAiChoice(q.id, cIdx, 'choiceText', e.target.value)}
                                style={{ flex: 1 }}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="form-group">
                          <label>Explanation</label>
                          <textarea 
                            placeholder="Add an explanation for this question..."
                            value={q.explanation}
                            onChange={(e) => editAiQuestion(q.id, 'explanation', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                <button type="button" className="cancel-pill" onClick={() => setShowAiPreview(false)}>Discard All</button>
                <button 
                  type="button" 
                  className="save-pill" 
                  onClick={acceptAiQuestions}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Check size={18} />
                  Accept & Add {aiGeneratedQuestions.length} Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {previewingNote && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={24} color="var(--primary-color)" />
                <h2>Content Preview</h2>
              </div>
              <button className="close-btn" onClick={() => setPreviewingNote(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-accent)' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {previewingNote.title}
              </h3>
              {previewingNote.author && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  By {previewingNote.author}
                </p>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--bg-accent)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Preview:</strong> This is how the content will appear in the mobile app
              </div>
              <ContentPreview 
                content={previewingNote.content} 
                show={true}
              />
            </div>

            <div className="modal-footer" style={{ padding: '15px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
              <button 
                type="button" 
                className="cancel-pill" 
                onClick={() => setPreviewingNote(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingFile && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ width: '90%', height: '90vh', maxWidth: '1200px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <PdfViewer 
              pdfUrl={viewingFile.filePath || viewingFile.url} 
              onClose={() => setViewingFile(null)} 
            />
          </div>
        </div>
      )}
      {showContentTypeManager && (
        <ContentTypeManager onClose={() => setShowContentTypeManager(false)} />
      )}
    </div>
  );
};
export default ContentPage;

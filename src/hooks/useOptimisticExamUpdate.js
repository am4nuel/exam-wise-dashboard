import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';

/**
 * Custom hook for optimistic exam updates with change tracking
 * Only sends changed data to the backend for maximum performance
 */
export const useOptimisticExamUpdate = () => {
  const { addToast } = useToast();
  const originalDataRef = useRef(null);
  
  // Store original exam data when editing starts
  const startEditing = (examData) => {
    originalDataRef.current = JSON.parse(JSON.stringify(examData));
  };

  // Deep comparison to detect changes
  const hasChanged = (original, current) => {
    return JSON.stringify(original) !== JSON.stringify(current);
  };

  // Calculate differential changes
  const calculateDiff = (originalExam, currentExam) => {
    const diff = {
      examData: null,
      questionsToUpdate: [],
      questionsToAdd: [],
      questionsToDelete: [],
      choicesToUpdate: [],
      choicesToAdd: [],
      choicesToDelete: []
    };

    // Check exam metadata changes
    const examFields = ['title', 'description', 'duration', 'totalMarks', 'totalQuestions', 
                        'passingScore', 'examType', 'price', 'isFree', 'courseId', 
                        'universityId', 'departmentId', 'fieldId', 'topicId'];
    
    const examDataChanges = {};
    let hasExamChanges = false;
    
    examFields.forEach(field => {
      if (originalExam[field] !== currentExam[field]) {
        examDataChanges[field] = currentExam[field];
        hasExamChanges = true;
      }
    });
    
    if (hasExamChanges) {
      diff.examData = examDataChanges;
    }

    // Track questions by ID
    const originalQuestionsMap = new Map();
    const currentQuestionsMap = new Map();
    
    (originalExam.questions || []).forEach(q => {
      if (q.id && !String(q.id).startsWith('temp_')) {
        originalQuestionsMap.set(q.id, q);
      }
    });
    
    (currentExam.questions || []).forEach(q => {
      if (q.id && !String(q.id).startsWith('temp_')) {
        currentQuestionsMap.set(q.id, q);
      }
    });

    // Find deleted questions
    originalQuestionsMap.forEach((q, id) => {
      if (!currentQuestionsMap.has(id)) {
        diff.questionsToDelete.push(id);
      }
    });

    // Find new and updated questions
    (currentExam.questions || []).forEach(currentQ => {
      // New question (no ID or temp ID)
      if (!currentQ.id || String(currentQ.id).startsWith('temp_')) {
        const { id, ...questionData } = currentQ;
        const choicesData = (questionData.choices || []).map(c => {
          const { id: cId, ...choiceRest } = c;
          return choiceRest;
        });
        diff.questionsToAdd.push({ ...questionData, choices: choicesData });
      } 
      // Existing question - check for changes
      else if (originalQuestionsMap.has(currentQ.id)) {
        const originalQ = originalQuestionsMap.get(currentQ.id);
        
        // Check question fields
        const qFields = ['questionText', 'questionType', 'marks', 'explanation', 'topicId', 'orderNumber'];
        let questionChanged = false;
        const questionUpdate = { id: currentQ.id };
        
        qFields.forEach(field => {
          if (originalQ[field] !== currentQ[field]) {
            questionUpdate[field] = currentQ[field];
            questionChanged = true;
          }
        });
        
        if (questionChanged) {
          diff.questionsToUpdate.push(questionUpdate);
        }

        // Check choices
        const originalChoicesMap = new Map();
        const currentChoicesMap = new Map();
        
        (originalQ.choices || []).forEach(c => {
          if (c.id && !String(c.id).startsWith('temp_')) {
            originalChoicesMap.set(c.id, c);
          }
        });
        
        (currentQ.choices || []).forEach(c => {
          if (c.id && !String(c.id).startsWith('temp_')) {
            currentChoicesMap.set(c.id, c);
          }
        });

        // Deleted choices
        originalChoicesMap.forEach((c, id) => {
          if (!currentChoicesMap.has(id)) {
            diff.choicesToDelete.push(id);
          }
        });

        // New and updated choices
        (currentQ.choices || []).forEach(currentC => {
          if (!currentC.id || String(currentC.id).startsWith('temp_')) {
            // New choice
            const { id, ...choiceData } = currentC;
            diff.choicesToAdd.push({ ...choiceData, questionId: currentQ.id });
          } else if (originalChoicesMap.has(currentC.id)) {
            // Check for changes
            const originalC = originalChoicesMap.get(currentC.id);
            const cFields = ['choiceText', 'isCorrect', 'orderNumber'];
            let choiceChanged = false;
            const choiceUpdate = { id: currentC.id };
            
            cFields.forEach(field => {
              if (originalC[field] !== currentC[field]) {
                choiceUpdate[field] = currentC[field];
                choiceChanged = true;
              }
            });
            
            if (choiceChanged) {
              diff.choicesToUpdate.push(choiceUpdate);
            }
          }
        });
      }
    });

    return diff;
  };

  // Optimistic update with rollback support
  const updateExam = async (examId, currentExam, onSuccess, onError) => {
    if (!originalDataRef.current) {
      addToast('error', 'No original data found');
      return;
    }

    const diff = calculateDiff(originalDataRef.current, currentExam);
    
    // Check if anything changed
    const hasChanges = diff.examData || 
                       diff.questionsToUpdate.length > 0 ||
                       diff.questionsToAdd.length > 0 ||
                       diff.questionsToDelete.length > 0 ||
                       diff.choicesToUpdate.length > 0 ||
                       diff.choicesToAdd.length > 0 ||
                       diff.choicesToDelete.length > 0;

    if (!hasChanges) {
      addToast('info', 'No changes detected');
      if (onSuccess) onSuccess(currentExam);
      return;
    }

    // Optimistic update - call success immediately
    if (onSuccess) onSuccess(currentExam);
    addToast('success', 'Saving changes...');

    try {
      // Send differential update to backend
      const response = await API.patch(`/admin/exams/${examId}/differential`, diff);
      
      // Update was successful
      addToast('success', 'Exam updated successfully', { replace: true });
      
      // Update original data reference
      originalDataRef.current = JSON.parse(JSON.stringify(response.data));
      
    } catch (error) {
      console.error('Update failed:', error);
      addToast('error', 'Failed to save changes. Please try again.', { replace: true });
      
      // Rollback - call error handler
      if (onError) onError(originalDataRef.current);
    }
  };

  return {
    startEditing,
    updateExam,
    hasChanged: (current) => originalDataRef.current && hasChanged(originalDataRef.current, current)
  };
};

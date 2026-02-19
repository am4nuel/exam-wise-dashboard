// Example: How to integrate the optimistic update hook into ContentPage.jsx

import { useOptimisticExamUpdate } from '../hooks/useOptimisticExamUpdate';

// Inside ContentPage component:
const { startEditing, updateExam } = useOptimisticExamUpdate();

// When opening edit modal:
const openEditModal = (item) => {
  setEditingItem(item);
  setFormData({
    ...item,
    title: item.title || item.fileName || '',
    courseId: item.courseId || '',
    universityId: item.universityId || '',
    departmentId: item.departmentId || '',
    fieldId: item.fieldId || '',
    topicId: item.topicId || '',
    questions: item.questions || []
  });
  
  // START TRACKING CHANGES
  startEditing(item);
  
  setShowModal(true);
};

// Replace handleSubmit for exams:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (activeTab === 'exams' && editingItem) {
    // Use optimistic update for exam edits
    await updateExam(
      editingItem.id,
      formData,
      // Success callback - runs immediately (optimistic)
      (updatedExam) => {
        setShowModal(false);
        // Update local data optimistically
        setData(prevData => 
          prevData.map(item => item.id === editingItem.id ? updatedExam : item)
        );
      },
      // Error callback - runs if backend fails (rollback)
      (originalExam) => {
        // Revert to original data
        setFormData(originalExam);
      }
    );
    return;
  }
  
  // ... existing code for other tabs and new exams
};

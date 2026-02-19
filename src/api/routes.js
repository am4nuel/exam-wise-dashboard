const ROUTES = {
  ADMIN: {
    LOGIN: '/admin/login',
    STATS: '/admin/stats',
    USERS: '/admin/users',
    CREATE_USER: '/admin/users',
    UPDATE_USER: (id) => `/admin/users/${id}`,
    DELETE_USER: (id) => `/admin/users/${id}`,
    TOGGLE_USER_STATUS: (id) => `/admin/users/${id}/toggle-status`,
    
    METADATA: '/admin/metadata',
    
    EXAMS: '/admin/exams',
    EXAM_DETAILS: (id) => `/admin/exams/${id}`,
    CREATE_EXAM: '/admin/exams',
    UPDATE_EXAM: (id) => `/admin/exams/${id}`,
    UPDATE_EXAM_DIFFERENTIAL: (id) => `/admin/exams/${id}/differential`,
    DELETE_EXAM: (id) => `/admin/exams/${id}`,
    
    FILES: '/admin/files',
    CREATE_FILE: '/admin/files',
    UPDATE_FILE: (id) => `/admin/files/${id}`,
    DELETE_FILE: (id) => `/admin/files/${id}`,
    
    SHORT_NOTES: '/admin/short-notes',
    CREATE_SHORT_NOTE: '/admin/short-notes',
    UPDATE_SHORT_NOTE: (id) => `/admin/short-notes/${id}`,
    DELETE_SHORT_NOTE: (id) => `/admin/short-notes/${id}`,
    UPLOAD_FILE: '/admin/upload',
    GITHUB_REPOS: '/admin/github-repos',
    
    // Videos
    VIDEOS: '/admin/videos',
    CREATE_VIDEO: '/admin/videos',
    UPDATE_VIDEO: (id) => `/admin/videos/${id}`,
    DELETE_VIDEO: (id) => `/admin/videos/${id}`,

    // Packages
    PACKAGES: '/admin/packages',
    CREATE_PACKAGE: '/admin/packages',
    UPDATE_PACKAGE: (id) => `/admin/packages/${id}`,
    DELETE_PACKAGE: (id) => `/admin/packages/${id}`,
    PACKAGE_SUBSCRIBERS: (id) => `/admin/packages/${id}/subscribers`,
    
    // Package Types
    PACKAGE_TYPES: '/admin/package-types',
    UPDATE_PACKAGE_TYPE: (id) => `/admin/package-types/${id}`,
    DELETE_PACKAGE_TYPE: (id) => `/admin/package-types/${id}`,

    // Content Types
    CONTENT_TYPES: '/admin/content-types',
    UPDATE_CONTENT_TYPE: (id) => `/admin/content-types/${id}`,
    DELETE_CONTENT_TYPE: (id) => `/admin/content-types/${id}`,
    
    // Universities & Fields
    UNIVERSITIES: '/admin/universities',
    UPDATE_UNIVERSITY: (id) => `/admin/universities/${id}`,
    DELETE_UNIVERSITY: (id) => `/admin/universities/${id}`,
    ADD_UNIVERSITY_FIELDS: (id) => `/admin/universities/${id}/fields`,
    REMOVE_UNIVERSITY_FIELD: (id, fieldId) => `/admin/universities/${id}/fields/${fieldId}`,
    
    FIELDS: '/admin/fields',
    UPDATE_FIELD: (id) => `/admin/fields/${id}`,
    DELETE_FIELD: (id) => `/admin/fields/${id}`,

    // Departments
    DEPARTMENTS: '/admin/departments',
    UPDATE_DEPARTMENT: (id) => `/admin/departments/${id}`,
    DELETE_DEPARTMENT: (id) => `/admin/departments/${id}`,

    // Courses & Topics
    COURSES: '/admin/courses',
    BULK_CREATE_COURSES: '/admin/courses/bulk',
    UPDATE_COURSE: (id) => `/admin/courses/${id}`,
    DELETE_COURSE: (id) => `/admin/courses/${id}`,
    
    TOPICS: '/admin/topics',
    UPDATE_TOPIC: (id) => `/admin/topics/${id}`,
    DELETE_TOPIC: (id) => `/admin/topics/${id}`,

    // Analytics
    ANALYTICS: '/admin/analytics',
    
    // Transactions & Withdrawals
    TRANSACTIONS: '/admin/transactions',
    DELETE_WITHDRAWAL: (id) => `/admin/withdrawals/${id}`,
    
    // Details
    PACKAGE_DETAILS: (id) => `/admin/packages/${id}/details`,
    USER_DETAILS: (id) => `/admin/users/${id}/details`,
    USER_SUBSCRIPTIONS: (id) => `/admin/users/${id}/subscriptions`,
    USER_TRANSACTIONS: (id) => `/admin/users/${id}/transactions`,
    ADD_USER_SUBSCRIPTION: (id) => `/admin/users/${id}/subscriptions`,

    // Push Notifications
    SEND_PUSH: '/admin/push-notification',
    SEND_BROADCAST: '/admin/broadcast-notification',

    // Firebase Configs
    FIREBASE_CONFIGS: '/admin/firebase-configs',
    UPDATE_FIREBASE_CONFIG: (id) => `/admin/firebase-configs/${id}`,
    DELETE_FIREBASE_CONFIG: (id) => `/admin/firebase-configs/${id}`,
    SET_DEFAULT_FIREBASE_CONFIG: (id) => `/admin/firebase-configs/${id}/set-default`
  },
  // Add other resource routes as needed
};

export default ROUTES;

export const SEMESTERS = [
  { value: 'Fall', label: 'Fall' },
  { value: 'Winter', label: 'Winter' },
  { value: 'Spring', label: 'Spring' },
  { value: 'Summer', label: 'Summer' }
];

export const YEARS = [
  { value: '2018', label: '2018' },
  { value: '2019', label: '2019' },
  { value: '2020', label: '2020' },
  { value: '2021', label: '2021' },
  { value: '2022', label: '2022' },
  { value: '2023', label: '2023' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' }
];

export const DEPARTMENTS = [
  { value: '', label: 'All' },
  { value: 'AMS', label: 'AMS' },
  { value: 'BMI', label: 'BMI' },
  { value: 'CSE', label: 'CSE' },
  { value: 'ESE', label: 'ESE' }
];

export const DEPARTMENTS_REQ = [
  { value: 'AMS', label: 'AMS' },
  { value: 'BMI', label: 'BMI' },
  { value: 'CSE', label: 'CSE' },
  { value: 'ESE', label: 'ESE' }
];

export const SORT_FIELDS = [
  { value: 'lastName', label: 'Last Name'},
  { value: 'firstName', label: 'First Name'},
  { value: 'sbuId', label: 'Student ID'},
  { value: 'satisfied', label: 'Satisfied'},
  { value: 'pending', label: 'Pending'},
  { value: 'unsatisfied', label: 'Unsatisfied'},
  { value: 'gpa', label: 'GPA'},
  { value: 'entrySemYear', label: 'Entry'},
  { value: 'gradSemYear', label: 'Grad'},
  { value: 'graduated', label: 'Graduated'},
  { value: 'track', label: 'Track'}
]

export const SORT_ORDER = [
  { value: true, label: 'Ascending'},
  { value: false, label: 'Descending'},
]

export const BOOLEAN = [
  { value: 'true', label: 'True'},
  { value: 'false', label: 'False'},
]

export const COMPLETENESS = [
  { value: 'true', label: 'Complete'},
  { value: 'false', label: 'Incomplete'}
]

export const TRACKS = {
  "AMS": [
    { value: 'Computational Applied Mathematics', label:'Computational Applied Mathematics'},
    { value: 'Computational Biology', label : 'Computational Biology'},
    { value: 'Operations Research', label: 'Operations Research'},
    { value: 'Statistics', label: 'Statistics'},
    { value: 'Quantitative Finance', label: 'Quantitative Finance'}
  ],
  "BMI": [
    { value: 'Imaging Informatics With Thesis', label:'Imaging Informatics With Thesis'},
    { value: 'Imaging Informatics With Project', label: 'Imaging Informatics With Project'},
    { value: 'Clinical Informatics With Thesis', label: 'Clinical Informatics With Thesis'},
    { value: 'Clinical Informatics With Project', label: 'Clinical Informatics With Project'},
    { value: 'Translational Bioinformatics With Thesis', label: 'Translational Bioinformatics With Thesis'},
    { value: 'Translational Bioinformatics With Project', label: 'Translational Bioinformatics With Project'}
  ],
  "CSE": [
    { value: 'Advanced Project', label:'Advanced Project'},
    { value: 'Special Project', label: 'Special Project'},
    { value: 'Thesis', label: 'Thesis'}
  ],
  "ESE": [
    { value: 'Non-Thesis', label:'Non-Thesis'},
    { value: 'Thesis', label: 'Thesis'}
  ]

}



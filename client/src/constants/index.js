export const CURRENT_SEMESTER = 'Spring'
export const CURRENT_YEAR = '2021'

export const SEMESTERS = [
  { value: 'Fall', label: 'Fall' },
  { value: 'Spring', label: 'Spring' },
  { value: 'SummerI', label: 'SummerI' },
  { value: 'SummerII', label: 'SummerII' }
]

export const MONTH_SEMESTER = {
  '02': 'Spring',
  '05': 'SummerI',
  '07': 'SummerII',
  '08': 'Fall'
}

export const SEMESTER_MONTH = {
  'Spring': 2,
  'SummerI': 5,
  'SummerII': 5,
  'Fall': 8
}

export const YEARS = [
  { value: '2018', label: '2018' },
  { value: '2019', label: '2019' },
  { value: '2020', label: '2020' },
  { value: '2021', label: '2021' },
  { value: '2022', label: '2022' },
  { value: '2023', label: '2023' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' }
]

export const GRADES = [
  { value: 'A', label: 'A' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'B-', label: 'B-' },
  { value: 'C+', label: 'C+' },
  { value: 'C', label: 'C' },
  { value: 'C-', label: 'C-' },
  { value: 'F', label: 'F' }
]

export const DEPARTMENTS = [
  { value: '', label: 'All' },
  { value: 'AMS', label: 'AMS' },
  { value: 'BMI', label: 'BMI' },
  { value: 'CSE', label: 'CSE' },
  { value: 'ESE', label: 'ESE' }
]

export const DEPARTMENTS_REQ = [
  { value: 'AMS', label: 'AMS' },
  { value: 'BMI', label: 'BMI' },
  { value: 'CSE', label: 'CSE' },
  { value: 'ESE', label: 'ESE' }
]

export const BOOLEAN = [
  { value: 'True', label: 'True' },
  { value: 'False', label: 'False' },
]

export const COMPLETENESS = [
  { value: 'Complete', label: 'Complete' },
  { value: 'Incomplete', label: 'Incomplete' }
]

export const VALIDITY = [
  { value: 'Valid', label: 'Valid' },
  { value: 'Invalid', label: 'Invalid' }
]

export const TRACKS = {
  'AMS': [
    { value: 'Computational Applied Mathematics', label: 'Computational Applied Mathematics' },
    { value: 'Computational Biology', label: 'Computational Biology' },
    { value: 'Operations Research', label: 'Operations Research' },
    { value: 'Statistics', label: 'Statistics' },
    { value: 'Quantitative Finance', label: 'Quantitative Finance' }
  ],
  'BMI': [
    { value: 'Imaging Informatics With Thesis', label: 'Imaging Informatics With Thesis' },
    { value: 'Imaging Informatics With Project', label: 'Imaging Informatics With Project' },
    { value: 'Clinical Informatics With Thesis', label: 'Clinical Informatics With Thesis' },
    { value: 'Clinical Informatics With Project', label: 'Clinical Informatics With Project' },
    { value: 'Translational Bioinformatics With Thesis', label: 'Translational Bioinformatics With Thesis' },
    { value: 'Translational Bioinformatics With Project', label: 'Translational Bioinformatics With Project' }
  ],
  'CSE': [
    { value: 'Advanced Project', label: 'Advanced Project' },
    { value: 'Special Project', label: 'Special Project' },
    { value: 'Thesis', label: 'Thesis' },
    { value: 'Advanced Project Proficiency', label: 'Advanced Project Proficiency' },
    { value: 'Special Project Proficiency', label: 'Special Project Proficiency' },
    { value: 'Thesis Proficiency', label: 'Thesis Proficiency' }
  ],
  'ESE': [
    { value: 'Non-thesis', label: 'Non-thesis' },
    { value: 'Thesis', label: 'Thesis' }
  ]
}



from numpy import random
import names
import bcrypt
import csv
from pathlib import Path

NUM_STUDENTS = 3000

DEPARTMENTS = ['AMS', 'BMI', 'CSE', 'ESE']
TRACKS = {
    'AMS': ['Computational Applied Mathematics', 'Computational Biology', 'Operations Research', 'Statistics',
            'Quantitative Finance'],
    'CSE': ['Advanced Project', 'Special Project', 'Thesis', 'Advanced Project Proficiency', 'Special Project Proficiency', 'Thesis Proficiency'],
    'BMI': ['Imaging Informatics With Thesis', 'Imaging Informatics With Project', 'Clinical Informatics With Thesis',
            'Clinical Informatics With Project', 'Translational Bioinformatics With Thesis',
            'Translational Bioinformatics With Project'],
    'ESE': ['Non-thesis', 'Thesis']
}
YEARS = [2018, 2019, 2020, 2021]
SEMESTERS = {
    2: 'Spring',
    8: 'Fall'
}

student_list = [['sbu_id', 'first_name', 'last_name', 'email', 'department', 'track', 'entry_semester',
                    'entry_year', 'requirement_version_semester', 'requirement_version_year', 'graduation_semester',
                    'graduation_year', 'password']]

entry_sem_years = []
for y in YEARS:
    for sem in SEMESTERS:
        entry_sem_years.append(y * 100 + sem)

entry_sem_years.pop()

sem_years = []
YEARS.append(2022)
for y in YEARS:
    for sem in SEMESTERS:
        sem_years.append(y * 100 + sem)
YEARS.pop()

for j in range(NUM_STUDENTS):
    student_id = random.randint(100000000, 1000000000)
    first_name = names.get_first_name()
    last_name = names.get_last_name()
    email = (first_name + last_name + '@stonybrook.edu').lower()
    dept = DEPARTMENTS[random.randint(0, len(DEPARTMENTS))]
    track = TRACKS[dept][random.randint(0, len(TRACKS[dept]))]
    entry_sem_year = entry_sem_years[random.randint(0, len(entry_sem_years))]
    entry_year = entry_sem_year // 100
    entry_sem = SEMESTERS[entry_sem_year % 100]
    entry_sem_year_index = entry_sem_years.index(entry_sem_year)
    grad_sem_year = 0
    if entry_sem == 'Spring':
        grad_sem_year = entry_sem_year + 106
    elif entry_sem == 'Fall':
        grad_sem_year = entry_sem_year + 194
    grad_sem = SEMESTERS[grad_sem_year % 100]
    grad_year = grad_sem_year // 100
    grad_sem_year_index = sem_years.index(grad_sem_year)
    req_sem_year = sem_years[random.randint(entry_sem_year_index, grad_sem_year_index)]
    req_year = req_sem_year // 100
    req_sem = SEMESTERS[req_sem_year % 100]
    password = bcrypt.hashpw(str.encode((first_name[0] + last_name[0] + str(student_id)).lower()), bcrypt.gensalt()).decode('utf-8')
    student_list.append([student_id, first_name, last_name, email, dept, track, entry_sem, entry_year, req_sem,
                         req_year, grad_sem, grad_year, password])

student_list.pop(0)

file_name = str(Path(__file__).parent.parent.absolute()) + '/student_profile_file.csv'
print(file_name)
with open(file_name, 'a+', newline='') as file:
    csv_writer = csv.writer(file)
    csv_writer.writerows(student_list)
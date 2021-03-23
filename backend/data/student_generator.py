from numpy import random
import names
import hashlib
import csv
from pathlib import Path

NUM_STUDENTS = 50

DEPARTMENTS = ["CSE", "AMS", "BMI", "ESE"]
TRACKS = {
    'AMS': ["Computational Applied Mathematics", "Computational Biology", "Operations Research", "Statistics",
            "Quantitative Finance"],
    "CSE": ["Advanced Project", "Special Project", "Thesis"],
    "BMI": ["Imaging Informatics With Thesis", "Imaging Informatics With Project", "Clinical Informatics With Thesis",
            "Clinical Informatics With Project", "Translational Bioinformatics With Thesis",
            "Translational Bioinformatics With Thesis"],
    "ESE": ["Non-Thesis", "Thesis"]
}
YEARS = [2019, 2020, 2021]
SEMESTERS = {
    2: "Spring",
    8: "Fall"
}


student_list = [["sbu_id", "first_name", "last_name", "email", "department", "track", "entry_semester",
                    "entry_year", "requirement_version_semester", "requirement_version_year", "graduation_semester",
                    "graduation_year", "password"]]

entry_sem_years = []
for y in YEARS:
    for sem in SEMESTERS:
        entry_sem_years.append(y * 100 + sem)

for j in range(NUM_STUDENTS):
    student_id = random.randint(100000000, 1000000000)
    first_name = names.get_first_name()
    last_name = names.get_last_name()
    email = (first_name + last_name + "@stonybrook.edu").lower()
    dept = DEPARTMENTS[random.randint(0, 4)]
    track = TRACKS[dept][random.randint(0, len(TRACKS[dept]))]
    entry_sem_year = entry_sem_years[random.randint(0, len(entry_sem_years))]
    entry_year = entry_sem_year // 100
    entry_sem = SEMESTERS[entry_sem_year % 100]
    entry_sem_year_index = entry_sem_years.index(entry_sem_year)
    req_sem_year = entry_sem_years[random.randint(entry_sem_year_index, len(entry_sem_years))]
    req_year = req_sem_year // 100
    req_sem = SEMESTERS[req_sem_year % 100]
    grad_sem_year = entry_sem_year + 200
    grad_sem = SEMESTERS[grad_sem_year % 100]
    grad_year = grad_sem_year // 100
    pw_hash = hashlib.sha256((first_name+last_name).lower().encode())
    password = pw_hash.hexdigest()
    student_list.append([student_id, first_name, last_name, email, dept, track, entry_sem, entry_year, req_sem,
                         req_year, grad_sem, grad_year, password])


file_name = str(Path(__file__).parent.absolute()) + '/student_profile_file.csv'
with open(file_name, 'w+', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(student_list)

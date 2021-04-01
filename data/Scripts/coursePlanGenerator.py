import random
import pandas as pd
import json
import copy
from pathlib import Path

# This program generates course plans for all students in student_profile_file.csv.
# You MUST change semesters and years manually in student_course_plan_file.csv since
# this generator creates course plan items for available semesters that are found first.
# Before running this generator, you might need to edit the path of degree requirements
# json files, master.csv (where course offerings are saved), and student_profile_file.csv.


# Returns random section number if course c is available for the semester and year.
def get_section(c, semester, year, course_df):
    department = c[:3]
    course_num = c[3:]
    df1 = course_df[(course_df['department'] == department) & (course_df['course_num'] == int(course_num))]
    if len(df1) == 0:
        return -2
    if year == 2018:
        year = 2019
    if year >= 2021:
        if semester == "Fall":
            year = 2020
        else:
            year = 2021
    df2 = df1[(df1['semester'] == semester) & (df1['year'] == year)]
    if len(df2):
        return random.choice(df2['section'].values)
    return -1


# Returns a course plan item if course c can be found in course offerings csv
def make_course_plan(stud, c, course_df, semester, year):
    cp = "\n" + str(stud[0]) + ","
    while True:
        section = get_section(c, semester, year, course_df)
        if section == -2:
            return "does not exist"
        elif section == -1:
            if stud[4] == semester and stud[5] == year:
                return "does not exist"
            if semester == "Fall":
                semester = "Spring"
                year += 1
            else:
                semester = "Fall"
        else:
            cp += c[:3] + "," + c[3:] + ","
            if year < 2021 or (year == 2021 and semester == "Spring"):
                cp += str(section)
            cp += "," + semester + "," + str(year) + ","
            if year < 2021:
                cp += random.choice(GRADES)
            return cp


# Picks random course from courses in requirement and returns course plan item
def choose_n(requirement, stud, course_plan, course_df, semester, year):
    r = copy.deepcopy(requirement)
    cp = ""
    cpi = "does not exist"
    while cpi == "does not exist":
        c = random.choice(r)
        if c != "BMI592" and c[:3] + "," + c[3:] in course_plan:
            continue
        cpi = make_course_plan(stud, c, course_df, semester, year)
        r.remove(c)
    cp += cpi
    return cp


TRACKS = {
    "AMS": ["Computational Applied Mathematics", "Computational Biology", "Operations Research", "Statistics",
            "Quantitative Finance"],
    "CSE": ["Advanced Project Option", "Special Project Option", "Thesis Option"],
    "BMI": ["Imaging Informatics With Thesis", "Imaging Informatics With Project", "Clinical Informatics With Thesis",
            "Clinical Informatics With Project", "Translational Bioinformatics With Thesis",
            "Translational Bioinformatics With Thesis"],
    "ESE": ["Non-Thesis", "Thesis"]
}

GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C"]

path = str(Path(__file__).parent.parent.absolute())

# Opens degree requirements json for AMS, BMI, CSE, and ESE
with open(path + "/Requirements/degree-requirements-AMS.json", "r") as read_file:
    AMS_dreq = json.load(read_file)
with open(path + "/Requirements/degree-requirements-BMI.json", "r") as read_file:
    BMI_dreq = json.load(read_file)
with open(path + "/Requirements/degree-requirements-CSE.json", "r") as read_file:
    CSE_dreq = json.load(read_file)
with open(path + "/Requirements/degree-requirements-ESE.json", "r") as read_file:
    ESE_dreq = json.load(read_file)

# Creates dictionary where the key is track and value is its requirements
course_req = {}
for degree in TRACKS:
    for track in TRACKS[degree]:
        course_req[track] = []

# Fills the dictionary with requirements for each track in AMS
for i in range(1, len(TRACKS['AMS']) + 1):
    reqs = AMS_dreq['degree' + str(i)]['courseRequirements']
    track = AMS_dreq['degree' + str(i)]['track']
    requirements = []
    for req in reqs:
        requirements.append(req[1:])
    course_req[track] = requirements

# Fills the dictionary with requirements for each track in BMI
for i in range(1, len(TRACKS['BMI']) + 1):
    reqs = BMI_dreq['degree' + str(i)]['courseRequirements']
    track = BMI_dreq['degree' + str(i)]['track']
    requirements = []
    for req in reqs:
        if req[0] == "1:(4,4):(,)":
            for x in range(4):
                requirements.append(req[1:])
        elif req[0] != "0:(,):(,6)":
            requirements.append(req[1:])
    course_req[track] = requirements

# Fills the dictionary with requirements for each track in CSE
for i in range(1, len(TRACKS['CSE']) + 1):
    reqs = CSE_dreq['degree' + str(i)]['courseRequirements']
    track = CSE_dreq['degree' + str(i)]['track'] + " Option"
    requirements = []
    for req in reqs:
        if req[0] == "2:(2,2):(,)":
            requirements.append(["CSE523"])
            requirements.append(["CSE524"])
        elif req[0] != "0:(,):(,6)":
            requirements.append(req[1:])
        if req[0] == "0:(,):(,)":
            for x in range(5):
                requirements.append(req[1:])
    course_req[track] = requirements

# Fills the dictionary with requirements for each track in ESE
for i in range(1, len(TRACKS['ESE']) + 1):
    reqs = ESE_dreq['degree' + str(i)]['courseRequirements']
    track = ESE_dreq['degree' + str(i)]['track']
    requirements = []
    for req in reqs:
        if req[0] != "0:(,):(,6)" and req[0] != "0:(,):(,3)":
            requirements.append(req[1:])
        if req[0] == "0:(,):(,)":
            requirements.append(req[1:])
            requirements.append(req[1:])
    course_req[track] = requirements

# Get all students and their relevant information from student_profile_file.csv
students = []
profile_df = pd.read_csv(path + '/student_profile_file.csv')
df = profile_df.iloc[185:]
for ind in df.index:
    track = df['track'][ind]
    if df['department'][ind] == 'CSE':
        track += " Option"
    students.append([df['sbu_id'][ind], df['entry_semester'][ind], df['entry_year'][ind],
                     track, df['graduation_semester'][ind],
                     df['graduation_year'][ind]])

course_df = pd.read_csv(path + '/CourseOfferings/master.csv')

# Add course plan items for each student to student_course_plan_file.csv
for student in students:
    requirements = course_req[student[3]]
    course_plan = ""
    for courses in requirements:
        course_plan += choose_n(courses, student, course_plan, course_df, semester, year)
    # with open(path + '/student_course_plan_file.csv', 'a') as fd:
    #     fd.write(course_plan)

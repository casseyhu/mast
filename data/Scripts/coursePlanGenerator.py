import random
import numpy as np
import pandas as pd
import json
import csv
import copy
from pathlib import Path


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
with open(path + "/Requirements/AMS/degree-requirements-AMS-Fall-2019.json", "r") as read_file:
    AMS_dreq = json.load(read_file)
with open(path + "/Requirements/BMI/degree-requirements-BMI-Fall-2019.json", "r") as read_file:
    BMI_dreq = json.load(read_file)
with open(path + "/Requirements/CSE/degree-requirements-CSE-Fall-2019.json", "r") as read_file:
    CSE_dreq = json.load(read_file)
with open(path + "/Requirements/ESE/degree-requirements-ESE-Fall-2019.json", "r") as read_file:
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
    if track == "Quantitative Finance":
        for i in range(len(reqs)):
            if i != 11:
                requirements.append(reqs[i][1:])
    elif track == "Computational Biology":
        for req in reqs:
            if req[0] != "1:(3,3):(0,0)":
                requirements.append(req[1:])
    elif track == "Statistics":
        for i in range(len(reqs)):
            if i < 2 or i > 7:
                requirements.append(reqs[i][1:])
    else:
        for req in reqs:
            requirements.append(req[1:])
    course_req[track] = requirements

# Fills the dictionary with requirements for each track in BMI
for i in range(1, len(TRACKS['BMI']) + 1):
    reqs = BMI_dreq['degree' + str(i)]['courseRequirements']
    track = BMI_dreq['degree' + str(i)]['track']
    requirements = []
    for req in reqs:
        if req[0] != "1:(4,4):(,)" and req[0] != "0:(,):(,6)":
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


# Get prereqs for all courses
prereq_df = pd.read_csv(path + '/prereqs.csv')
prereq_df = prereq_df[prereq_df['prereqs'].notna()]


# Get all students and their relevant information from student_profile_file.csv
students = []
profile_df = pd.read_csv(path + '/student_profile_file.csv')
df = profile_df[profile_df['department'] == "AMS"]
for ind in df.index:
    track = df['track'][ind]
    if df['department'][ind] == 'CSE':
        track += " Option"
    student = {
        "sbu_id": df['sbu_id'][ind],
        "entry_sem": df['entry_semester'][ind],
        "entry_year": df['entry_year'][ind],
        "grad_sem": df['graduation_semester'][ind],
        "grad_year": df['graduation_year'][ind],
        "degree": df['department'][ind],
        "track": track,
        "num_courses": {},
        "course_plan": "",
        "courses": [],
        "schedule": {}
    }
    students.append(student)

course_df = pd.read_csv(path + '/CourseOfferings/master.csv')


def get_section_time(course, semester, year, course_df):
    df1 = course_df[(course_df['course_num'] == int(course[3:]))
                    & (course_df['department'] == course[:3])]
    if len(df1) == 0:
        return (-1, "")
    if year == 2018:
        year = 2019
    if year >= 2021:
        year = 2021
    df2 = df1[(df1['semester'] == semester) & (df1['year'] == year)]
    if len(df2) == 0:
        return (-1, "")
    course_df[(course_df['department'] == course[:3]) &
              (course_df['course_num'] == course[3:])]
    return (random.choice(df2['section'].values), df2['timeslot'].values[0])


def convert_time(str_time):
    time = int(str_time[:2]) * 60
    if str_time[5:7] == "PM" and time != 12 * 60:
        time += 12 * 60
    time += int(str_time[3:5])
    return time


def has_conflicts(timeslot, time):
    for t in timeslot:
        if (time[0] > t[0] and time[0] < t[1]) or (time[1] > t[0] and time[1] < t[1]):
            return True
    return False


def add_course(course, section, student, semester, year, GRADES):
    cp = "\n" + str(student['sbu_id']) + "," + \
        course[:3] + "," + str(course[3:]) + ","
    if year < 2021 or (year == 2021 and semester == "Spring"):
        cp += str(section)
    cp += "," + semester + "," + str(year) + ","
    if year < 2021:
        cp += random.choice(GRADES)
    student['course_plan'] += cp
    student['courses'].append(course)
    student['num_courses'][semester + " " + str(year)] -= 1


def check_time(time, section, course, student, semester, year):
    if type(time) == float:
        add_course(course, section, student, semester, year, GRADES)
    else:
        day = time.split()[0]
        t = time.split()[1]
        time_str = t.split("-")
        t = (convert_time(time_str[0]), convert_time(time_str[1]))
        slots = None
        if "HTBA" in day:
            add_course(course, section, student, semester, year, GRADES)
        else:
            if "M" in day:
                slots = student['schedule'][semester + " " + str(year)]["M"]
            if "TU" in day:
                slots = student['schedule'][semester + " " + str(year)]["TU"]
            if "W" in day:
                slots = student['schedule'][semester + " " + str(year)]["W"]
            if "TH" in day:
                slots = student['schedule'][semester + " " + str(year)]["TH"]
            if "F" in day:
                slots = student['schedule'][semester + " " + str(year)]["F"]
            if slots != None:
                if slots == []:
                    add_course(course, section, student, semester, year, GRADES)
                else:
                    if not has_conflicts(slots, t):
                        add_course(course, section, student,
                                semester, year, GRADES)
                slots.append(t)


def prereq_satisfied(course, student, prereq_df, semester, year):
    c = prereq_df[prereq_df['courseId'] == course]
    if len(c) == 0:
        return True
    prereqs_str = c['prereqs'].values[0]
    ex = '`'
    count = 0
    if 'or' in prereqs_str:
        ex = 'or'
    prereqs_str = prereqs_str.replace('\"', "")
    prereqs_str = prereqs_str.replace(' ', "")
    prereqs = prereqs_str.split(ex)
    semester_year = year * 100 + (2 if semester == "Spring" else 8)
    for prereq in prereqs:
        if int(prereq[3]) < 5:
            count += 1
        else:
            course_plan = student['course_plan'].split("\n")
            course_plan.remove('')
            for cp in course_plan:
                item = cp.split(",")
                sem_yr = int(item[5]) * 100 + (2 if item[5] == "Spring" else 8)
                if prereq[:3]==item[1] and str(prereq[3:])==item[2] and sem_yr < semester_year:
                    count += 1
        if ex == 'or' and count >= 1:
            return True
    return count == len(prereqs)   


def add_course_plan_item(requirement, student, semester, year, course_df, GRADES, prereq_df):
    course = None
    time = None
    section = None
    count = 0
    for i in range(len(requirement)):
        course = requirement[i]
        count += 1
        # Skip duplicates
        if course != "BMI592" and course != "AMS532" and course in student['courses']:
            continue
        # Skip if prereqs are not already in course plan
        if not prereq_satisfied(course, student, prereq_df, semester, year):
            continue
        section_time = get_section_time(course, semester, year, course_df)
        section = section_time[0]
        time = section_time[1]
        # course is offered in current sem
        if section != -1:
            check_time(time, section, course, student, semester, year)
            break
        # course is not offered in current sem
        else:
            if count == len(requirement):
                return -1
            # get next course
            continue
        
course_plans = ""

# Add course plan items for each student to student_course_plan_file.csv
for student in students:
    requirements = course_req[student['track']]
    if student['degree'] != 'AMS':
        continue
    while True:
        semester = student['entry_sem']
        year = student['entry_year']
        length = len(requirements)
        if student['track'] == "Computational Biology" or "Quantitative Finance":
            length = len(requirements) - 1
        num_courses = list(np.random.multinomial(length, [1/4.] * 4))
        while 0 in num_courses:
            num_courses = list(np.random.multinomial(length, [1/4.] * 4))
        for i in range(4):
            student['schedule'][semester + " " + str(year)] = {
                "M": [],
                "TU": [],
                "W": [],
                "TH": [],
                "F": []
            }
            if student['track'] == "Thesis":
                if semester == "Spring":
                    student['num_courses'][semester + " " + str(year)] = 4
                elif i >= 3:
                    student['num_courses'][semester + " " + str(year)] = 2
                else:
                    student['num_courses'][semester + " " + str(year)] = 1
            elif student['track'] == "Non-Thesis":
                if semester == "Spring":
                    student['num_courses'][semester + " " + str(year)] = 4
                else:
                    student['num_courses'][semester + " " + str(year)] = 2
            # elif student['track'] == "Operations Research":
            #     if semester == "Fall":
            #         student['num_courses'][semester + " " + str(year)] = 3
            #     else:
            #         student['num_courses'][semester + " " + str(year)] = 2
            else:
                student['num_courses'][semester +" " + str(year)] = num_courses[-1]
                num_courses.pop()
            if student['degree'] == "BMI":
                student['num_courses'][semester + " " + str(year)] += 1
                add_course_plan_item(["BMI592"], student, semester, year, course_df, GRADES, prereq_df)
            if student['track'] == "Computational Biology" and i != 0:
                student['num_courses'][semester + " " + str(year)] += 1
                add_course_plan_item(["AMS532"], student, semester, year, course_df, GRADES, prereq_df)
            if semester == "Fall":
                semester = "Spring"
                year += 1
            else:
                semester = "Fall"
        semester = student['entry_sem']
        year = student['entry_year']
        if student['track'] == "Statistics" and student['entry_sem'] == "Spring":
            add_course_plan_item(["AMS570"], student, "Spring", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS572"], student, "Fall", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS571"], student, "Fall", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS573"], student, "Spring", student['entry_year']+1, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS578"], student, "Spring", student['entry_year']+1, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS582"], student, "Fall", student['entry_year']+1, course_df, GRADES, prereq_df)
        if student['track'] == "Statistics" and student['entry_sem'] == "Fall":
            add_course_plan_item(["AMS570"], student, "Spring", student['entry_year']+1, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS572"], student, "Fall", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS571"], student, "Fall", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS573"], student, "Spring", student['entry_year']+2, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS578"], student, "Spring", student['entry_year']+2, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS582"], student, "Fall", student['entry_year']+1, course_df, GRADES, prereq_df)
        if student['track'] == "Quantitative Finance" and student['entry_sem'] == "Spring":
            add_course_plan_item(["AMS586"], student, "Spring", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS511"], student, "Fall", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS513"], student, "Spring", student['entry_year']+1, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS516"], student, "Fall", student['entry_year']+1, course_df, GRADES, prereq_df)
        if student['track'] == "Quantitative Finance" and student['entry_sem'] == "Fall":
            add_course_plan_item(["AMS586"], student, "Spring", student['entry_year']+1, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS511"], student, "Fall", student['entry_year'], course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS513"], student, "Spring", student['entry_year']+1, course_df, GRADES, prereq_df)
            add_course_plan_item(["AMS516"], student, "Fall", student['entry_year']+1, course_df, GRADES, prereq_df)

        random.shuffle(requirements)
        for i in range(length):
            courses = requirements[i]
            random.shuffle(courses)
            # no courses can be added because no courses are offered in current sem
            if add_course_plan_item(courses, student, semester, year, course_df, GRADES, prereq_df) == -1:
                # iterate through other semesters
                for sem_year in student['schedule'].keys():
                    s = sem_year.split()[0]
                    y = int(sem_year.split()[1])
                    if student['num_courses'][s + " " + str(y)] <= 0:
                        continue
                    # courses are not offered in current sem year
                    if add_course_plan_item(courses, student, s, y, course_df, GRADES, prereq_df) == -1:
                        # try next sem year
                        continue
                    # a course is added to course plan
                    break
            # reached num_courses limit
            if student['num_courses'][semester + " " + str(year)] <= 0:
                # increment sem year if current sem year is not graduation sem year
                if semester != student['grad_sem'] or year != student['grad_year']:
                    if semester == "Fall":
                        semester = "Spring"
                        year += 1
                    else:
                        semester = "Fall"
        
        sum = 0
        for sem_year in student['num_courses']:
            sum += student['num_courses'][sem_year]
        print(student['course_plan'])
        print(student['track'], sum, student['num_courses'])
        if sum <= 0:
            break
        student['course_plan'] = ""
        student['courses'] = []
    course_plans += student['course_plan']
    print(student['course_plan'])

with open(path + '/student_course_plan_file1.csv', 'a') as fd:
    fd.write(course_plans)
    
    # for cpi in student['course_plan']:
    #     course_plans.append(cpi.split(","))
# with open(path + '/student_course_plan_file.csv', 'a+', newline="") as file:
#     csv_writer = csv.writer(file)
#     csv_writer.writerows(course_plans)

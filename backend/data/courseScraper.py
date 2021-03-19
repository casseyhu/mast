from bs4 import BeautifulSoup
import time
from selenium import webdriver
import sys
import csv


    # README: How to use: 
    # 1) Go to SBU class find. 
    # 2) Apply the filters for: Semester, GRAD, and Course 
    #     Ex: Filters: Spring 2021, GRAD, CSE
    # 3) After applying filters, grab the URL and paste it for the /url/ variable below. 
    # 5) Create an empty / have an existing .csv file in the same directory as this script. 
    # 6) Download the Chrome webdriver: 
    #     https://chromedriver.chromium.org/downloads
    # 7) Change the /driver/ variable's path to the path to the Chrome webdriver executable. 
    #     Ex:
    #         C:\Users\User\Desktop\chromedriver.exe
    # 8) Run the program
    #     python courseScraper.py <Semester> <Year> <Course> <outputfile.csv>
    #     Ex:
    #         python courseScraper.py Spring 2021 CSE spr2021.csv

#-------------------------------------------------- CONFIG --------------------------------------------------#
# Change the URL as per the readme. 
url = ''
driver = webdriver.Chrome(executable_path=r'')
#-----------------------------------------------END CONFIG --------------------------------------------------#


COURSES = []
if (sys.argv[3] == 'CSE'):
    COURSES = ['502','504','505','506','507','508','509','510','511','512','514','515','516','517',
                '518','519','521', '522','523','524','525','526','527','528','529','530','531', '532', 
                '533', '534', '535', '536','537','538','540','541','542','544','545','546','547','548',
                '549','550','551','552','555', '564','566','570','577','581','582','587','590','591',
                '592','593','594','595','596','597','599','600','602','605','608','610','613','614','615',
                '617','620','621','624','625','626','628','633', '638','639','641','642','643','644','645',
                '646','648','649','650','651','652','653','654','655','656','657','658','659','660',
                '661','662','665','669','670','671','672','674','677','681','684','686','687','690',
                '691','692','693','696','697','698','699']
elif (sys.argv[3] == 'BMI'):
    COURSES = ['501','502','503','511','512','513','514','517','520','530','540','550','551','552','560','590','591',
                '592','595','596','598','599','620','622','625','690','691','692','695','696','697','698','699']
elif (sys.argv[3] == 'AMS'):
    COURSES = ['500','501','502','503','504','505','507','510','511','512','513','514','515','516','517','518',
            '519','522','523','526','527','528','530','531','532','533','534','535','536','537','538','539',
            '540','542','544','545','546','547','548','549','550','552','553','555','556','559','560','561',
            '562','565','566','569','570','571','572','573','575','577','578','580','581','582','583','585',
            '586','587','588','589','591','592','593','594','595','596','597','598','599','600','601','603',
            '621','641','644','651','652','670','675','676','683','690','691','695','696','698','699']
else: # ESE courses
    COURSES = ['500','501','502','503','504','505','507','509','510','511','512','513','514','515','516','517',
            '518','519','520','522','523','524','525','526','528','530','531','532','533','534','536','537','538',
            '540','541','542','543','544','545','546','547','548','549','550','552','553','554','555','556','557',
            '558','563','565','566','568','569','575','576','579','581','585','586','587','588','589','590','591',
            '597','599','610','670','691','697','698','699']



driver.maximize_window()
driver.get(url)
count = 0

added = {}
courses_scraped = []

while True:
    content = driver.page_source
    soup = BeautifulSoup(content, "html.parser")
    l = soup.find('ul', {'class': 'recordSet'})
    for i in l.findChildren('li', recursive=False):
        Lab = False
        course_num = ((i.find('div', {'class': 'span-2'})).find('a', {'class': 'title'}).text)
        course = course_num[1:4]
        section = course_num[-3:len(course_num) - 1]
        course_num = course_num[4:7]
        # if course_num not in COURSES:
        #     continue
        if course_num[0] < '0' or course_num[0] > '9'  or section[0] < '0' or section[0] > '9':
            continue
        if int(section) >= 90:
            continue
        course_name = ((i.find('div', {'class': 'span-11'})).find('a', {'class': 'title'}).text)
        course_info = ((i.find('div', {'class': 'span-11'})).find('div', {'class': 'resultItemLine1'}).find('a', {'href': 'javascript://'}).find('img').get('title'))
        course_info = course_info.replace('<b>', '')
        course_info = course_info.replace('</b>', '')
        course_info = course_info.replace('<br/>', '\n')
        texts = ((i.find('div', {'class': 'span-11'})).text)
        texts = " ".join(texts.split())
        if texts.find('LEC :') == -1 and texts.find('LEC: ') == -1 and texts.find('SEM :') == -1 and texts.find('LAB :') == -1:
            texts = texts.split()
            # print(texts)
            # print(texts[-4], texts[-2])
            if course+course_num not in added:
                added[course+course_num] = True
                csv_fields = []
                dum = texts[-4]+' '+texts[-2]
                if dum == 'TUT 01:00AM-01:00AM' or dum == '3.0 :APPT' or dum == '3.0 FLEX' or dum == ':APPT Attr:INTERNSHIP,':
                    csv_fields = [course, course_num, section, sys.argv[1], sys.argv[2], '']
                else:
                    csv_fields = [course, course_num, section, sys.argv[1], sys.argv[2], texts[-4]+' '+texts[-2]]
                print(csv_fields)
                courses_scraped.append(csv_fields)
            count += 1
        else:
            texts = texts[texts.find('by') + 3::]
            course_instructor = texts[0:texts.find(' ')].replace(',', ', ')

            #Check for labs/recitations
            recitation_day = None
            recitation_time = None
            extra = ""
            if texts.find('REC :') != -1 or texts.find('LAB :') != -1:
                if texts.find('REC :') != -1:
                    texts = texts[(texts.find('REC :') + 5)::]
                    extra = "R"
                elif texts.find('LAB :') != -1:
                    texts = texts[(texts.find('LAB :') + 5)::]
                    extra = "L"
                    Lab = True
                if texts.find('RETU') != -1:
                    copy = texts[texts.find('RETU') + 2::].split()
                    recitation_day = copy[0]
                    recitation_time = copy[1]
                    extra = "R"
                elif texts.find('RETH') != -1:
                    copy = texts[texts.find('RETH') + 2::].split()
                    recitation_day = copy[0]
                    recitation_time = copy[1]
                    extra = "R"
                elif texts.find('RECM') != -1:
                    copy = texts[texts.find('RECM') + 3::].split()
                    recitation_day = copy[0]
                    recitation_time = copy[1]
                    extra = "R"
                elif texts.find('RECW') != -1:
                    copy = texts[texts.find('RECW') + 3::].split()
                    recitation_day = copy[0]
                    recitation_time = copy[1]
                    extra = "R"
                elif texts.find('RECF') != -1:
                    copy = texts[texts.find('RECF') + 3::].split()
                    recitation_day = copy[0]
                    recitation_time = copy[1]
                    extra = "R"
                elif texts[0:3] != "REC":
                    copy = texts.split()
                    recitation_day = copy[0]
                    recitation_time = copy[1]
            rec_start_time, rec_end_time = None, None
            if recitation_time != None:
                rec_start_time, rec_end_time = recitation_time.split('-')[0], recitation_time.split('-')[1]
            if texts.find('LEC :') != -1:
                texts = texts[(texts.find('LEC :') + 5)::]
            elif texts.find('LEC: ') != -1:
                texts = texts[(texts.find('LEC: ') + 5)::]
            elif texts.find('SEM :') != -1:
                texts = texts[(texts.find('SEM :') + 5)::]
            texts = texts.split()
            course_day = texts[0]
            course_time = texts[1]
            if course_time == recitation_time and course_day == recitation_day:
                rec_start_time = None
                rec_end_time = None
                recitation_day = None
            course_start_time, course_end_time = course_time.split('-')[0], course_time.split('-')[1]
            if recitation_day == "FLEX":
                rec_start_time = None
                rec_end_time = None
            if course_day == "FLEX":
                course_start_time = None
                course_end_time = None
            # print(course, course_num, section, course_day, course_start_time, course_end_time, recitation_day, rec_start_time, rec_end_time)
            csv_fields = []
            if course_day == None or course_start_time == None or course_end_time == None:
                print(course, course_num, section, course_day, course_start_time, course_end_time, recitation_day, rec_start_time, rec_end_time)
                csv_fields = [course, course_num, section, sys.argv[1], sys.argv[2], '']
            else:
                csv_fields = [course, course_num, section, sys.argv[1], sys.argv[2], course_day+' '+course_start_time+'-'+course_end_time]
            print(csv_fields)
            courses_scraped.append(csv_fields)
            count += 1
    try:
        loadMoreButton = driver.find_element_by_xpath("//a[contains(text(), 'Next')]")
        loadMoreButton.location_once_scrolled_into_view
        loadMoreButton.click()
    except Exception as e:
        print(e)
        break
    time.sleep(0.01)

csvfile = open(sys.argv[4], 'a+', newline='')
writer = csv.writer(csvfile)
for course in courses_scraped:
    writer.writerow(course)

print("Complete")

print(count)
driver.quit()
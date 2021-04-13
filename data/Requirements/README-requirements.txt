CourseRequirements objects contain arrays of this form:
    ["type:(min # of courses,max # of courses):(min # of credits,max # of credits)", 
     "course1", "course2", ...]

type
    type = 0 
        - Represents the non-required courses that the student can choose to take.
        - Used for restrictions that don’t need to be shown under student’s 
          degree requirements for the courses in the list
        - Requirements such as “only 4 credits of CSE 501 can be counted 
          towards the degree” and “CSE 502 cannot be counted towards the degree” 
          will have a type of 0 
        - The courseRequirement object that starts with "0:(,):(,)" will contain 
          all non required courses that can be used to satisfy the 
          creditRequirement.
        - These requirements will not be given a state.
    type = 1 
        - Represents the required list of course(s) that students should take.
        - If the bulletin specifically states “4 core courses and 3 electives are 
          required”, then there would be 4 course requirements of type 1 and 3 course 
          requirements of type 3 [see below].
        - Requirements of this type will each have a state.
    type = 2
        - Represents thesis or project specific course requirements that the student 
          should take.
        - These requirements will be grouped together and share a state when we 
          are displaying degree requirements.
    type = 3
        - Represents elective courses that were specifically mentioned in the bulletin.

(min # of courses, max # of courses)
    (2,)  => Students must take at least 2 courses from the list.
    (1,1) => Students must take at least 1 course from the list, only 1 course 
             can be applied towards their credit requirement.
    (,3)  => Only up to 3 courses from the list can be applied towards the students
             credit requirement.
    (,)   => No restrictions on the number of times the courses in the list can be 
             taken. There could still be restrictions on the number of credits.

(min # of credits, max # of credits)
    (3,)  => Students must take at least three credits worth of the courses from 
             the list.
    (6,6) => Students must take at least 6 credits worth of courses from the list, 
             only 6 credits can be applied towards their credit requirement.
    (,2)  => Only up to 2 credits from the list can be applied towards the students
             credit requirement.
    (,)   => No restrictions on the number of credits the courses in the list 
             can be taken. There could still be restrictions on the number of 
             courses.
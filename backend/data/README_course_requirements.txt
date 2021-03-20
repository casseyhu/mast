CourseRequirements objects contain arrays of this form:
    [ “type:(min # of courses,max # of courses):(min # of credits,max # of credits)”, 
    "course1", "course2", ...]

type
    type = 1 
        - Denotes that students should take the course(s) in the list
        - If the bulletin specifically states “4 core courses and 3 electives are 
          required”, then there would be 7 course requirements of type 1.
        - Requirements of this type will each have a state.
    type = 0 
        - Denotes that students can choose to take the course(s) in the list
        - Used for non required courses 
        - Used for restrictions that don’t need to be shown under student’s 
          degree requirements for the courses in the list
        - Requirements such as “only 4 credits of CSE 501 can be counted 
          towards the degree” and “CSE 502 cannot be counted towards the degree” 
          will have a type of 0 
        - The courseRequirement object that starts with "0:(,):(,)" will contain 
          all non required courses that can be used to satisfy the 
          creditRequirement.
        - These requirements will not be given a state.
    type = 2
        - Denotes thesis or project specific course requirements
        - Students should take the courses in the list.
        - These requirements will be grouped together and share a state when we 
          are displaying degree requirements.

(min # of courses, max # of courses)
    (2,)  => Students should/can take courses in the list at least twice.
    (1,1) => Students should/can take courses in the list exactly once.
    (,3)  => Students should/can take courses in the list at most three times.
    (,)   => No restrictions on the number of times the courses in the list can be 
             taken. There could still be restrictions on the number of credits.

(min # of credits, max # of credits)
    (3,)  => Students should/can take at least three credits of the courses in 
             the list.
    (6,6) => Students should/can take exactly six credits of the courses in the 
             list.
    (,2)  => Students should/can take courses in the list for up to two credits.
    (,)   => No restrictions on the number of credits the courses in the list 
             can be taken. There could still be restrictions on the number of 
             courses.

// Deals with importing course offerings csv file.
// department,course_num,section,semester,year,timeslot
//Ex: AMS,537,02,Fall,2020,TUTH 11:30AM-12:50PM
//Ex: CSE,537,01,Spring,2021,MW 06:05PM-07:25PM
//Ex: CSE,504,,Spring,2021,MF 01:00PM-02:20PM <Missing section> 


// The system maintains the following information about course offerings: 
//  - course identifier (e.g., CSE 507), 
//  - course name, 
//  - semester (Fall, Winter, Spring, SummerI, or SummerII), 
//  - year, and 
//  - timeslot. 
// the system also maintains information about course prerequisites that are graduate courses. o
// ther kinds of prerequisites, such as an undergraduate course or equivalent experience, are ignored.

var path = require('path')
const fs = require('fs')
var filePath = "./backend/data/gradcourses-spring2021-edited.pdf"

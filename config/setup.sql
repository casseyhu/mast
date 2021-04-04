use mast;

-- CREATE GPDS FOR EACH DEPARTMENT
-- passwords: computer, math, biomed, electric
INSERT INTO gpds VALUES (110011, 'CSE', 'C.R.', 'Ramakrishnan', 'cse@stonybrook.edu', '$2b$10$wCasSaJvY65vsB/5oPXmlOLEemqeo7/D48TmhP6fm7JTGg8aEl8lq');
INSERT INTO gpds VALUES (110022, 'AMS','Wei', 'Zhu', 'ams@stonybrook.edu', '$2b$10$PcC20AcNFA3KPoaTqO0.DesK1x0JaP/m4ecIXeCQVdm9VBP8f61U.');
INSERT INTO gpds VALUES (110033, 'BMI','Richard', 'Moffitt', 'bmi@stonybrook.edu', '$2b$10$e9jTXEDbGDzbO5UGKRMoxOIu9HwC1qKEj6kZuKNRBZeLkiEi5RFu2');
INSERT INTO gpds VALUES (110044, 'ESE','Leon', 'Shterengas', 'ese@stonybrook.edu', '$2b$10$eS9bDYBOqN/3aN5fCyrKquhrkzp4x5oCvRqz5enBK1mvD96O7dw2K');

-- CREATE SOME STUDENTS
-- passwords: first name
INSERT INTO students VALUES (111623150, 'Cassey', 'Hu', 'casseyhu@stonybrook.edu', '$2b$10$MhVJW7Nu5OqPk5eRmA/WKeavjg53uGY4viQ55x79/O3Ie2o5JKfPK', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'good job');
INSERT INTO students VALUES (111645277, 'Sooyeon', 'Kim', 'sooyeonkim@stonybrook.edu', '$2b$10$q/utWSRfp5O59qvb5x9td.twqupmINMZ7Dj/J/3eTUY.FDuZHNePa', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'good job');
INSERT INTO students VALUES (112206686, 'Eddie', 'Xu', 'eddiexu@stonybrook.edu', '$2b$10$jNBkorAEABkW91w6BeXkdeWvOmeP4uGElD0yWacpP1Q9YWUqxX2E2', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'u failed');
INSERT INTO students VALUES (111513756, 'Andrew', 'Kong', 'andrewkong@stonybrook.edu', '$2b$10$ZCKcaUIuWuUt8tobrgvhNuSkMfpLUROiJW5EdymvZkt8DhkBAtGR6', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'good job');

 
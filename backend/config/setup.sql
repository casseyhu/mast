use mast;

-- CREATE GPDS FOR EACH DEPARTMENT
-- passwords: computer, math, biomed, electric
INSERT INTO gpds VALUES (110011, 'C.R.', 'Ramakrishnan', 'cse@stonybrook.edu', 'AA97302150FCE811425CD84537028A5AFBE37E3F1362AD45A51D467E17AFDC9C');
INSERT INTO gpds VALUES (110022, 'Wei', 'Zhu', 'ams@stonybrook.edu', '58A6D6801AE771E632351013FFE8E53628287BF5310E469C8C48573669011EF0');
INSERT INTO gpds VALUES (110033, 'Richard', 'Moffitt', 'bmi@stonybrook.edu', '70F59D8BB2E1AB2162B99BB7B775072DD7D29D1D06E2CCCA96EA964BD3CF57EB');
INSERT INTO gpds VALUES (110044, 'Leon', 'Shterengas', 'ese@stonybrook.edu', '44B3C5003D93C5F1623BF53E26DABE4253E8AB4A42311E37C337E89F8F891274');

-- CREATE SOME STUDENTS
-- passwords: first name
INSERT INTO students VALUES (111623150, 'Cassey', 'Hu', 'casseyhu@stonybrook.edu', '94DDDA8953DF195F199C3A51C8E7194E644FFF9DD271A3AB6D2E6BB264025C18', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'good job');
INSERT INTO students VALUES (111645277, 'Sooyeon', 'Kim', 'sooyeonkim@stonybrook.edu', '079D8BD01D4570C3D86E0BFDBC1B2B1D61E5165125974D392EF38199F8EB7193', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'good job');
INSERT INTO students VALUES (112206686, 'Eddie', 'Xu', 'eddiexu@stonybrook.edu', '3B9D8298F1B5086D012618FEEBB2DA1A394357C1DAB7523443C9F6A743C4C84D', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'u failed');
INSERT INTO students VALUES (111513756, 'Andrew', 'Kong', 'andrewkong@stonybrook.edu', 'D979885447A413ABB6D606A5D0F45C3B7809E6FDE2C83F0DF3426F1FC9BFED97', null, 'Fall', 2020, 202008, 'Spring', 2022, 1, 0, 'good job');


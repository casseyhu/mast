import random
import pandas as pd
from pathlib import Path

pd.options.mode.chained_assignment = None  # default='warn'
department = "BMI"
GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C"]

cp_df = pd.read_csv(str(Path(__file__).parent.parent.absolute()) + '/student_course_plan_file.csv')
df = cp_df[(cp_df['semester'] == 'Spring') & (cp_df['year'] == 2021) & (cp_df['department'] == department)]
df['grade'] = df['grade'].apply(lambda v: random.choice(GRADES))
print(df)

df.to_csv(str(Path(__file__).parent.parent.absolute()) + '/' + department +'_grades.csv', index = False, header=True)

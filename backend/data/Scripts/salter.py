import bcrypt
import csv

# Opens the student profile csv, reads the firstname, hashes with bcrypt (salting)
# and creates/appends it to a new CSV file with the bcrypt hasehed password
 
student_csv = open('student_profile_file.csv', newline='') 
parse = csv.reader(student_csv)
out = open('student_profile.csv', 'a+', newline='')
writer = csv.writer(out)
header = False 
hashed_passwords = []
for row in parse: 
  if not header:
    writer.writerow(['sbu_id', 'first_name', 'last_name', 'email', 'department', 'track', 'entry_semester', 'entry_year', 'requirement_version_semester', 'requirement_version_year', 'graduation_semester', 'graduation_year', 'password'])
    header = True
    continue
  first = row[1]
  last = row[2]
  print(first +' '+last)
  row[len(row)-1] = bcrypt.hashpw(str.encode((first).lower()), bcrypt.gensalt()).decode("utf-8")
  writer.writerow(row)



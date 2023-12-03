import csv
import re

# Read the original CSV file
with open('students_intermediary.csv', 'r', encoding='utf-8') as csv_file:
    reader = csv.reader(csv_file)
    header = next(reader)  # Skip the header row
    data = list(reader)

# Create a new CSV file for the transformed data
with open('students_final.csv', 'w', newline='', encoding='utf-8') as new_csv_file:
    writer = csv.writer(new_csv_file)

    # Write the new header
    writer.writerow(['Country', 'Year', 'StudentsNb'])

    # Write the transformed data
    for row in data:
        country = row[0]
        for i in range(1, len(header)):
            year = int(header[i])
            students_nb_str = re.sub(r'\D', '', row[i])  # Remove non-numeric characters
            students_nb = int(students_nb_str) if students_nb_str else 0  # Convert to int, default to 0 if empty
            writer.writerow([country, year, students_nb])

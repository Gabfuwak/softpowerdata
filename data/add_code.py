import pandas as pd

def add_code_column(input_csv_path, output_csv_path):
    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv(input_csv_path)

    # Add a new column "code" with values as the row number
    df['code'] = df.index + 1

    # Save the DataFrame to a new CSV file
    df.to_csv(output_csv_path, index=False)


add_code_column("movies_parsing/movies_boxoffice_by_country.csv", "movies_boxoffice_by_country_code.csv")
add_code_column("students/students_final.csv", "students_final_code.csv")

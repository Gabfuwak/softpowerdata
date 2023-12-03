def merge_files(file_paths, output_path):
    with open(output_path, 'w') as output_file:
        for file_path in file_paths:
            with open(file_path, 'r') as input_file:
                print(input_file.name)
                output_file.write(input_file.read())

file_paths = ['1/output.csv', '2/output.csv', '3/output.csv', '4/output.csv', '5/output.csv', '6/output.csv', '7/output.csv', '8/output.csv', '9/output.csv', '10/output.csv'] 
output_path = 'movies_boxoffice_by_country.csv' 

merge_files(file_paths, output_path)

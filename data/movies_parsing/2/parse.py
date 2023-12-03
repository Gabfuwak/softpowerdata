from bs4 import BeautifulSoup
import requests
import csv

def get_content_inside_target_div(html_content, htmlclass):
    """
    Given an HTML code, find the main tag, and inside it, look for the first div with class 'a-fixed-left-grid'.
    Retrieve and return the content inside that div.
    """
    # Parse the HTML
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the main tag
    main_tag = soup.find('main')

    if main_tag:
        # Find the first div with class 'a-fixed-left-grid' inside the main tag
        target_div = main_tag.find('div', class_=htmlclass)

        if target_div:
            return target_div
        else:
            return 'No div with class "a-fixed-left-grid" found inside the main tag'
    else:
        return 'No main tag found in the HTML'

def find_divs_with_class(html_content, target_class):
    """
    Given an HTML code, find all divs with the specified class.
    """
    # Parse the HTML
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all divs with the specified class
    target_divs = soup.find('div', class_=target_class)

    return target_divs

def extract_table_data(html_content):
    """
    Given an HTML table, extract data and return it as a list of lists.
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the table
    tables = soup.find_all('table', class_='a-bordered a-horizontal-stripes a-size-base-plus')
    alldata = []
    for table in tables:
        if not table:
            print("Table not found in HTML.")
            return []

        # Extract data from the table
        table_data = []
        header_row = [th.text.strip() for th in table.find_all('th')]
        table_data.append(header_row)

        for row in table.find_all('tr')[1:]:
            row_data = [td.text.strip() for td in row.find_all(['td', 'th'])]
            table_data.append(row_data)

        alldata.append(table_data)
    return alldata

def write_to_csv(movie_name, data, filename='output.csv'):
    """
    Write data to a CSV file along with the movie name.
    """
    with open(filename, 'a', newline='', encoding='utf-8') as csvfile:  # Use 'a' to append
        csv_writer = csv.writer(csvfile)
        for tables in data[1:]:
            for element in tables[1:]:
                csv_writer.writerow([movie_name, element[0], element[2]])

processed_movies = set()

try:
    with open('processed_movies.txt', 'r') as processed_file:
        processed_movies.update(line.strip() for line in processed_file)
except FileNotFoundError:
    # Handle the case where the file doesn't exist
    pass

not_found_movies = []

with open('movies.txt', 'r') as file:
    for txt in file.readlines():
        movie_name = txt.strip()
        
        # Check if the movie has been processed before
        if movie_name in processed_movies:
            print(f'Movie already processed: {movie_name}')
            continue

        response = requests.get("https://www.boxofficemojo.com/search/?q=" + movie_name)
        html_data = str(get_content_inside_target_div(response.text, 'a-fixed-left-grid'))

        soup2 = BeautifulSoup(html_data, 'html.parser')

        movie_link = soup2.find('a', class_='a-link-normal')
        if movie_link:
            movie_id = movie_link['href'].split('/title/')[1].split('/')[0]

            print(f'Movie ID for {movie_name}: {movie_id}')

            response = requests.get("https://www.boxofficemojo.com/title/" + movie_id)

            content = str(find_divs_with_class(response.text, 'a-section mojo-h-scroll'))
            write_to_csv(movie_name, extract_table_data(content), filename='output.csv')

            # Update the set of processed movies in real-time
            processed_movies.add(movie_name)

            # Update the set of processed movies in the file
            with open('processed_movies.txt', 'a') as processed_file:
                processed_file.write(movie_name + '\n')

        else:
            print(f'Movie ID not found for {movie_name}')
            not_found_movies.append(movie_name)

# Update the list of not found movies
with open('not_found_movies.txt', 'w') as not_found_file:
    for movie in not_found_movies:
        not_found_file.write(movie + '\n')
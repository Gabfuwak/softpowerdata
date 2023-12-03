import pandas as pd

# Read the CSV file
df = pd.read_csv('movies_boxoffice_by_country_code.csv')

# Replace dollar values with integers
df['boxoffice'] = df['boxoffice'].replace('[\$,]', '', regex=True).astype(int)

# Save the modified DataFrame back to a CSV file
df.to_csv('movie_boxoffice_by_country_code_final.csv', index=False)

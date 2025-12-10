import pandas as pd
import os

from database_accessor_sqlalchemy import *

with open('EStL_WQDashboard.txt', 'r') as fid:
    sql_str = fid.read()
    print (sql_str)

query = dbqISWS() # ESTL_DB
query.sql_query(sql_str)
query.close_connection()

# Define the target directory and filename
output_directory = '../public/output/'
output_filename = 'EStL_AllDataJoin'

# Ensure the output directory exists (optional, but good practice)
os.makedirs(output_directory, exist_ok=True)

# Create the full path for the output file
output_path_csv = os.path.join(output_directory, output_filename + '.csv')
output_path_json = os.path.join(output_directory, output_filename + '.json')

# Save the DataFrame to CSV in the specified directory
query.data.to_csv(output_path_csv, index=False) # index=False prevents writing the DataFrame index to the CSV
# Save the DataFrame to json in the specified directory
query.data.to_json(output_path_json, index=False) # index=False prevents writing the DataFrame index to the json
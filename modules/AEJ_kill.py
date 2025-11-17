from database_accessor_sqlalchemy import *

def vdir(x):
    for i in dir(x):
        print(i)

with open('SQL_query2.txt', 'r') as fid:
    sql_str = fid.read()

query = dbqISWS() # ESTL_DB
query.sql_query(sql_str)

query.data.to_csv('test.csv')

# as you're learning
az = query.data
print(az.head.__doc__)

# next steps
# - saving csv --> save in the "public\outputs" folder
# - add "public\outputs" to the .gitignore
# - updating SQL string
# - QA/QC
#    - removing outliers for contaminant at a site
#    - moving averages/filters on contaminant at a site
#    - ...
# - save a second csv that has been updated
# - grab water level data from groundwaterproddatabase?
# - save data in csv?
# -


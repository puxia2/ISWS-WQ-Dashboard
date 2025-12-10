from database_accessor_sqlalchemy import *

def vdir(x):
    for i in dir(x):
        print(i)

with open('EStL_WQDashboard.txt', 'r') as fid:
    sql_str = fid.read()

query = dbqISWS() # ESTL_DB
query.sql_query(sql_str)

query.data.to_csv('test.csv')

# as you're learning
az = query.data
print(az.head.__doc__)

# next steps
# - saving csv, json --> save in the "public\outputs" folder -AZ 12/10
# - add "public\outputs" to the .gitignore -AJ 12/10
# - QA/QC
#    - conversion to the same units (ug/L) - result_value_ugL has been added to sql statement (EStL_WQDashboard.txt) - AZ 12/10
#    - removing outliers for contaminant at a site
#    - moving averages/filters on contaminant at a site
#    - ...
# - save a second csv that has been updated
# - grab water level data from groundwaterproddatabase?




"""

The purpose of this script is to modify the established class of the database queries
to tranform from pyodbc to sqlalchemy

ISWS, puxia2@illinois.edu, July 15th, 2024

"""

import math
from matplotlib import pyplot as plt
import pandas as pd
from sqlalchemy import create_engine, text
# import pyodbc


class dummyQuery:
    def __init__(self, fn):
        self.data = pd.read_csv(fn)


class dbqISWS(object):

    def sql_query(self, sql_string, returnbool=False):
        """
        This is where the query gets executed. query must start with "select." User has the option to return query
        results for direct assignment to a variable alongside the query results being assigned to self.data

        Parameters
        ----------
        sql_string: basestring
            a SQL query statement that must start with "select"
        returnbool: bool
            tells the function whether to return the query results or not. Query results will always be in self.data

        Returns
        -------
        self.data: pandas.DataFrame
            a pandas dataframe containing the query results

        """

        self.sql_string = sql_string

        if self.sql_string.split()[0].lower() != 'select':

            print("ISWS: Warning, sql string is not in the form a 'select' query; query not executed!")

        else:
            # self.data = pd.read_sql(sql=self.sql_string, con=self.connection)
            self.data = pd.DataFrame(self.connection.execute(text(self.sql_string)))

            if self.verbose:
                print("ISWS: query executed! self.data now populated!")

        if returnbool:
            return self.data

    def sql_query_with_variable(self, sql_string, values, returnbool=False):
        """
        This function is similar to the above one, but it allows users to add an additional variable in the query.
        query must start with "select."

        Parameters
        ----------
        sql_string: basestring
            a SQL query statement that must start with "select"
            e.g. values = {'year': 2019}
        values:
            a dicitonary of values to be inserted into the statement

        returnbool: bool
            tells the function whether to return the query results or not. Query results will always be in self.data

        Returns
        -------
        self.data: pandas.DataFrame
            a pandas dataframe containing the query results

        """

        self.sql_string = sql_string

        if self.sql_string.split()[0].lower() != 'select':

            print("ISWS: Warning, sql string is not in the form a 'select' query; query not executed!")

        else:
            # self.data = pd.read_sql(sql=self.sql_string, con=self.connection)
            self.data = pd.DataFrame(self.connection.execute(text(self.sql_string), values).fetchall())

            if self.verbose:
                print("ISWS: query executed! self.data now populated!")

        if returnbool:
            return self.data

    def get_list_of_tables(self, returnbool=True):
        """
        This method currently contains the hardcoded table options of the ESTL_DB. this is for reference only. In the
        future, a method to automate this may be developed.

        Returns
        -------
        self.list_of_tables: list
            returns a hard coded list of table names for reference
        """

        self.list_of_tables = ["dbo.TBL_Charts",
                               "dbo.TBL_Location_temp",
                               "dbo.TBL_Locations",
                               "dbo.TBL_Medium",
                               "dbo.TBL_Organization",
                               "dbo.TBL_Parameter",
                               "dbo.TBL_Project",
                               "dbo.TBL_Qualifiers",
                               "dbo.TBL_Reporting_Limit",
                               "dbo.TBL_Result_Remarks",
                               "dbo.TBL_Results",
                               "dbo.TBL_Sample",
                               "dbo.TBL_Sample_Type",
                               "dbo.TBL_Version"]

        if returnbool:
            return self.list_of_tables

    def plot_timeseries(self, plot_field, multipanel=False):
        """
        This method will check for the "DateTime" field within query results and plot the specified 'plot_field' by
        "Station_ID" with the option via 'multipanel' to give a clean, simple quick look or messy separated look with
        plots labeled by "Station_ID." Meant to serve as quick visual confirmation of query results.

        Parameters
        ----------
        plot_field: basestring
            string that is the field/column title the user wants to see plotted
        multipanel: bool
            boolean to switch from the

        Returns
        -------

        """

        if "DateTime" not in self.data.keys():

            print("ISWS: No 'DateTime' field selected with query, a time series plot will not be generated")

        elif plot_field not in self.data.keys():

            print("ISWS:", plot_field, "is not a field selected by the query, a time series plot will not be generated")

        elif not multipanel:

            fig, ax = plt.subplots(1, 1, figsize=(10,6))

            for stn in self.data.Station_ID.unique():
                stn_results = self.data[self.data.Station_ID == stn]
                ax.plot(stn_results.DateTime, stn_results.DTW_ft)


        else:

            numstations = self.data.Station_ID.unique().shape[0]

            nrow = round(math.sqrt(numstations))
            ncol = round(math.sqrt(numstations))
            if nrow == 0:
                nrow = 1
            if ncol == 0:
                ncol = 1
            if nrow * ncol < numstations:
                ncol = ncol + 1

            fig, ax = plt.subplots(nrow, ncol, figsize=(10,8))
            ax = ax.flatten()

            for iii, stn in enumerate(self.data.Station_ID.unique()):

                stn_results = self.data[self.data.Station_ID == stn]

                ax[iii].plot(stn_results.DateTime, stn_results.DTW_ft, 'o-', ms=2)
                ax[iii].set_title('Station_ID = ' + str(stn))

    def plot_map(self):

        print("ISWS: plot_map feature coming soon! Stay tuned!")

    def close_connection(self):
        """
        Closes the pyodbc connection.
        Returns
        -------
        None
        """

        self.connection.close()

        if self.verbose:
            print("ISWS: Database connection closed.")

    def __init__(self,
                 Driver="SQL Server",
                 Server="datastorm",
                 Database="ESTL_DB",
                 Trusted_Connection="yes",
                 verbose=True,
                 pckl_filename=None):
        """
        A python class to help coordinate sqlalchemy connections and query results with minimal supporting infrastructure.
        Originally set up for use with the "ESTL_DB" database on the "PRI-PEANUTS" server. ymmv - puxia2

        Parameters
        ----------
        Driver: basestring
            MPK does not know.
        Server: basestring
            string specifying which server you'd like to connect to
        Database
            string specifying which database you'd like to connect to
        Trusted_Connection: basestring
            Set to "yes" in order to use Windows Authentication with sqlalchemy and mssql
        verbose: bool
            boolean specifying whether you want your dbqISWS experience to print status messages
        """

        self.Driver = Driver
        self.Server = Server
        self.Database = Database
        self.Trusted_Connection = Trusted_Connection
        self.verbose = verbose

        self.pckl_filename = pckl_filename

        self.data = pd.DataFrame({})
        self.list_of_tables = []

        if self.pckl_filename is None:
            self.connection_str = ("Driver={" + self.Driver + "};" +
                                   "Server=" + self.Server + ";" +
                                   "Database=" + self.Database + ";" +
                                   "Trusted_Connection=" + self.Trusted_Connection + ";")

            self.database_connection = f"mssql://{Server}/{Database}?trusted_connection={Trusted_Connection}&driver={Driver}"

            self.engine = create_engine(self.database_connection)

            self.connection = self.engine.connect()

            # self.connection = pyodbc.connect(self.connection_str)

            self.get_list_of_tables(returnbool=False)

        else:
            self.data = pd.read_pickle(self.pckl_filename)

        if self.verbose:
            print("ISWS: database connection established!")


if __name__ == '__main__':

    # sql_str = """SELECT * FROM dbo.TBL_Charts;"""
    '''
    sql_str = """SELECT GW_OBV.OB_LOCATIONS.P_NUMBER, GW_OBV.OB_LOCATIONS.*, GW_OBV.OB_MEASUREMENTS.*
        FROM GW_OBV.OB_LOCATIONS INNER JOIN GW_OBV.OB_MEASUREMENTS ON GW_OBV.OB_LOCATIONS.P_NUMBER = GW_OBV.OB_MEASUREMENTS.P_Number
        WHERE (((GW_OBV.OB_LOCATIONS.P_NUMBER)=403609 Or (GW_OBV.OB_LOCATIONS.P_NUMBER)=403610 Or (GW_OBV.OB_LOCATIONS.P_NUMBER)=403611 Or (GW_OBV.OB_LOCATIONS.P_NUMBER)=403612 Or (GW_OBV.OB_LOCATIONS.P_NUMBER)=404869 Or (GW_OBV.OB_LOCATIONS.P_NUMBER)=135237));"""
    '''
    sql_str = """SELECT *, m.TIMESTAMP DateTime FROM GW_OBV.OB_LOCATIONS l 
        INNER JOIN GW_OBV.OB_MEASUREMENTS m ON l.P_NUMBER = m.P_Number
        WHERE l.P_NUMBER in (403609,403610,403611,403612,404869,135237)"""

    query = dbqISWS()
    query.sql_query(sql_str)
    query.close_connection()
    #orig query.plot_timeseries(plot_field='something')
    query.plot_timeseries(plot_field='DTW_FT_RAW')

    # query = dbqISWS(Driver="SQL Server",
    #                 Server="datastorm",
    #                 Database="ESTL_DB",
    #                 Trusted_Connection="yes",
    #                 verbose=True)
    #
    # query.sql_query(sql_str)
    # query.close_connection()
    #
    # # print(query.data.head())
    #
    # query.data.loc[:, 'p_num'] = query.data.iloc[:, 0]
    # query.data.loc[:, 'datetime'] = query.data.loc[:, 'TIMESTAMP']
    # query.data.loc[:, 'dtw_ft_raw'] = query.data.loc[:, 'DTW_FT_RAW'].astype('float')
    #
    # query.data.sort_values('datetime', inplace=True)
    #
    # for pnum in pd.unique(query.data.p_num):
    #
    #     welp = query.data[query.data.p_num == pnum]
    #     welp.reset_index(drop=True, inplace=True)
    #
    #     fig, ax = plt.subplots(1,1)
    #
    #     ax.plot(welp.datetime, welp.dtw_ft_raw)



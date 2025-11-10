
import math
import logging
from matplotlib import pyplot as plt
import pandas as pd
from sqlalchemy import create_engine, text

class dbqISWS:
    def __init__(self,
                 driver="SQL Server",
                 server="datastorm",
                 database="ESTL_DB",
                 trusted_connection="yes",
                 verbose=True,
                 pckl_filename=None):
        self.driver = driver
        self.server = server
        self.database = database
        self.trusted_connection = trusted_connection
        self.verbose = verbose
        self.pckl_filename = pckl_filename
        self.data = pd.DataFrame()
        self.list_of_tables = []

        if verbose:
            logging.basicConfig(level=logging.INFO)

        if pckl_filename:
            self.data = pd.read_pickle(pckl_filename)
        else:
            conn_str = f"mssql://{server}/{database}?trusted_connection={trusted_connection}&driver={driver}"
            self.engine = create_engine(conn_str)
            self.connection = self.engine.connect()
            self.get_list_of_tables(returnbool=False)

            if self.verbose:
                logging.info("ISWS: Database connection established.")

    def run_query(self, sql: str, params: dict = None, return_data: bool = False) -> pd.DataFrame:
        if not sql.strip().lower().startswith("select"):
            logging.warning("ISWS: SQL string is not a SELECT query; query not executed!")
            return pd.DataFrame()

        result = self.connection.execute(text(sql), params or {})
        self.data = pd.DataFrame(result.fetchall(), columns=result.keys())

        if self.verbose:
            logging.info("ISWS: Query executed! self.data now populated.")

        return self.data if return_data else None

    def get_list_of_tables(self, returnbool=True):
        self.list_of_tables = [
            "dbo.TBL_Charts", "dbo.TBL_Location_temp", "dbo.TBL_Locations",
            "dbo.TBL_Medium", "dbo.TBL_Organization", "dbo.TBL_Parameter",
            "dbo.TBL_Project", "dbo.TBL_Qualifiers", "dbo.TBL_Reporting_Limit",
            "dbo.TBL_Result_Remarks", "dbo.TBL_Results", "dbo.TBL_Sample",
            "dbo.TBL_Sample_Type", "dbo.TBL_Version"
        ]
        return self.list_of_tables if returnbool else None

    def plot_timeseries(self, plot_field: str, multipanel: bool = False):
        if "DateTime" not in self.data.columns or plot_field not in self.data.columns:
            logging.warning("ISWS: Required fields missing for time series plot.")
            return

        stations = self.data["Station_ID"].unique()
        if not multipanel:
            fig, ax = plt.subplots(figsize=(10, 6))
            for stn in stations:
                subset = self.data[self.data["Station_ID"] == stn]
                ax.plot(subset["DateTime"], subset[plot_field], label=f"Station {stn}")
            ax.legend()
        else:
            n = len(stations)
            nrow = int(math.ceil(math.sqrt(n)))
            ncol = int(math.ceil(n / nrow))
            fig, axes = plt.subplots(nrow, ncol, figsize=(12, 8), squeeze=False)
            axes = axes.flatten()

            for i, stn in enumerate(stations):
                subset = self.data[self.data["Station_ID"] == stn]
                axes[i].plot(subset["DateTime"], subset[plot_field], 'o-', ms=2)
                axes[i].set_title(f"Station_ID = {stn}")
            plt.tight_layout()

    def plot_map(self):
        logging.info("ISWS: plot_map feature coming soon! Stay tuned!")

    def close_connection(self):
        self.connection.close()
        if self.verbose:
            logging.info("ISWS: Database connection closed.")

if __name__ == '__main__':
    sql_str = """
    SELECT *, m.TIMESTAMP AS DateTime FROM GW_OBV.OB_LOCATIONS l 
    INNER JOIN GW_OBV.OB_MEASUREMENTS m ON l.P_NUMBER = m.P_Number
    WHERE l.P_NUMBER in (403609,403610,403611,403612,404869,135237)
    """

    query = dbqISWS()
    query.run_query(sql_str)
    query.plot_timeseries(plot_field='DTW_FT_RAW')
    query.close_connection()



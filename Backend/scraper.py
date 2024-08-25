import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Define the base URLs for the top 5 European leagues and their subpages with a placeholder for the season
LEAGUE_SUBPAGES_TEMPLATE = {
    'Premier League': {
        'stats': 'https://fbref.com/en/comps/9/{season}/stats/Premier-League-Stats',
        'shooting': 'https://fbref.com/en/comps/9/{season}/shooting/Premier-League-Stats',
        'passing': 'https://fbref.com/en/comps/9/{season}/passing/Premier-League-Stats',
        'gca': 'https://fbref.com/en/comps/9/{season}/gca/Premier-League-Stats',
        'defense': 'https://fbref.com/en/comps/9/{season}/defense/Premier-League-Stats',
        'possession': 'https://fbref.com/en/comps/9/{season}/possession/Premier-League-Stats'
    },
    'La Liga': {
        'stats': 'https://fbref.com/en/comps/12/{season}/stats/La-Liga-Stats',
        'shooting': 'https://fbref.com/en/comps/12/{season}/shooting/La-Liga-Stats',
        'passing': 'https://fbref.com/en/comps/12/{season}/passing/La-Liga-Stats',
        'gca': 'https://fbref.com/en/comps/12/{season}/gca/La-Liga-Stats',
        'defense': 'https://fbref.com/en/comps/12/{season}/defense/La-Liga-Stats',
        'possession': 'https://fbref.com/en/comps/12/{season}/possession/La-Liga-Stats'
    },
    'Serie A': {
        'stats': 'https://fbref.com/en/comps/11/{season}/stats/Serie-A-Stats',
        'shooting': 'https://fbref.com/en/comps/11/{season}/shooting/Serie-A-Stats',
        'passing': 'https://fbref.com/en/comps/11/{season}/passing/Serie-A-Stats',
        'gca': 'https://fbref.com/en/comps/11/{season}/gca/Serie-A-Stats',
        'defense': 'https://fbref.com/en/comps/11/{season}/defense/Serie-A-Stats',
        'possession': 'https://fbref.com/en/comps/11/{season}/possession/Serie-A-Stats'
    },
    'Bundesliga': {
        'stats': 'https://fbref.com/en/comps/20/{season}/stats/Bundesliga-Stats',
        'shooting': 'https://fbref.com/en/comps/20/{season}/shooting/Bundesliga-Stats',
        'passing': 'https://fbref.com/en/comps/20/{season}/passing/Bundesliga-Stats',
        'gca': 'https://fbref.com/en/comps/20/{season}/gca/Bundesliga-Stats',
        'defense': 'https://fbref.com/en/comps/20/{season}/defense/Bundesliga-Stats',
        'possession': 'https://fbref.com/en/comps/20/{season}/possession/Bundesliga-Stats'
    },
    'Ligue 1': {
        'stats': 'https://fbref.com/en/comps/13/{season}/stats/Ligue-1-Stats',
        'shooting': 'https://fbref.com/en/comps/13/{season}/shooting/Ligue-1-Stats',
        'passing': 'https://fbref.com/en/comps/13/{season}/passing/Ligue-1-Stats',
        'gca': 'https://fbref.com/en/comps/13/{season}/gca/Ligue-1-Stats',
        'defense': 'https://fbref.com/en/comps/13/{season}/defense/Ligue-1-Stats',
        'possession': 'https://fbref.com/en/comps/13/{season}/possession/Ligue-1-Stats'
    }
}

# Corresponding table IDs for each subpage
TABLE_IDS = {
    'stats': 'stats_standard',
    'shooting': 'stats_shooting',
    'passing': 'stats_passing',
    'gca': 'stats_gca',
    'defense': 'stats_defense',
    'possession': 'stats_possession'
}

def init_driver():
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    return webdriver.Chrome(options=chrome_options)

def process_multi_level_headers(header_rows):
    """Process multi-level headers by handling colspan and rowspan."""
    final_headers = []
    max_columns = 0

    # First, get the number of columns spanned by the header
    for row in header_rows:
        cells = row.find_elements(By.TAG_NAME, 'th')
        column_count = 0
        for cell in cells:
            colspan = int(cell.get_attribute('colspan')) if cell.get_attribute('colspan') else 1
            column_count += colspan
        max_columns = max(max_columns, column_count)

    # Create an empty list for each level of headers
    header_grid = [['' for _ in range(max_columns)] for _ in range(len(header_rows))]

    # Populate the header grid
    for row_idx, row in enumerate(header_rows):
        cells = row.find_elements(By.TAG_NAME, 'th')
        col_idx = 0
        for cell in cells:
            while header_grid[row_idx][col_idx] != '':
                col_idx += 1
            rowspan = int(cell.get_attribute('rowspan')) if cell.get_attribute('rowspan') else 1
            colspan = int(cell.get_attribute('colspan')) if cell.get_attribute('colspan') else 1
            for i in range(rowspan):
                for j in range(colspan):
                    header_grid[row_idx + i][col_idx + j] = cell.text.strip()
            col_idx += colspan

    # Now, combine the headers across rows to create a flattened header
    for col_idx in range(max_columns):
        combined_header = " - ".join([header_grid[row_idx][col_idx] for row_idx in range(len(header_rows)) if header_grid[row_idx][col_idx]])
        final_headers.append(combined_header)

    return final_headers

def scrape_table(driver, table_id):
    try:
        # Wait for the table to load (timeout after 15 seconds)
        table = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, table_id))
        )
    except TimeoutException:
        print(f"Timeout: Unable to locate the table with ID {table_id}")
        return pd.DataFrame()  # Return an empty DataFrame in case of a timeout

    # Extract the table headers
    header_rows = table.find_elements(By.TAG_NAME, 'thead')[0].find_elements(By.TAG_NAME, 'tr')
    if not header_rows:
        print("Warning: No <thead> found in the table")
        return pd.DataFrame()

    # Process multi-level headers
    headers = process_multi_level_headers(header_rows)
    print(f"Extracted Headers: {headers}")

    # Remove the first header (assumed to be 'Rk') and shift the remaining headers
    if headers:
        headers = headers[1:]
        print(f"Headers after removing 'Rk': {headers}")

    # Extract rows of data from the table body
    rows = table.find_elements(By.TAG_NAME, 'tbody')[0].find_elements(By.TAG_NAME, 'tr')
    data = []
    for row in rows:
        row_data = [td.text for td in row.find_elements(By.TAG_NAME, 'td')]
        if row_data:  # Skip empty rows
            data.append(row_data)

    # Handle column mismatch between headers and data
    if data and len(headers) != len(data[0]):
        if len(headers) > len(data[0]):
            print(f"Trimming headers from {len(headers)} to {len(data[0])}")
            headers = headers[:len(data[0])]
        elif len(headers) < len(data[0]):
            print(f"Filling headers from {len(headers)} to {len(data[0])}")
            headers += [''] * (len(data[0]) - len(headers))

    # Create a DataFrame if data is available
    if data:
        df = pd.DataFrame(data, columns=headers)
    else:
        df = pd.DataFrame()

    return df

def merge_league_tables(league_tables):
    """Merge multiple tables for a league on common columns like 'Player' and 'Squad'."""
    merged_data = league_tables[0]
    
    # Set of common columns that should never be dropped (e.g., Player, Squad)
    key_columns = {'Player', 'Squad'}
    
    # Drop columns from subsequent tables that are already in the first table to avoid duplication,
    # except for key columns like 'Player' and 'Squad'
    common_columns = set(merged_data.columns)  # Keep track of the columns we've already seen
    
    for table in league_tables[1:]:
        # Identify and drop columns that are already present in the merged data,
        # but never drop key columns like 'Player' and 'Squad'
        columns_to_drop = [col for col in table.columns if col in common_columns and col not in key_columns]
        if columns_to_drop:
            print(f"Dropping columns {columns_to_drop} from table to avoid duplication.")
            table = table.drop(columns=columns_to_drop, errors='ignore')
        
        # Merge the cleaned table with the merged data
        merged_data = pd.merge(merged_data, table, on=['Player', 'Squad'], how='outer')
        
        # Update the set of common columns with the new columns from this table
        common_columns.update(table.columns)
    
    return merged_data

def scrape_league_stats(league_name, league_urls):
    driver = init_driver()
    league_tables = []

    for category_name, category_url in league_urls.items():
        print(f"Scraping {category_name} stats from {category_url}")
        driver.get(category_url)
        table_id = TABLE_IDS[category_name]
        table_df = scrape_table(driver, table_id)
        if not table_df.empty:
            league_tables.append(table_df)

    driver.quit()  # Close the browser

    if league_tables:
        merged_league_data = merge_league_tables(league_tables)
        merged_league_data['League'] = league_name
        return merged_league_data
    else:
        return pd.DataFrame()

def generate_league_subpages_for_season(season):
    """
    Replace the {season} placeholder in the LEAGUE_SUBPAGES_TEMPLATE with the actual season.
    """
    league_subpages = {}
    for league_name, subpages in LEAGUE_SUBPAGES_TEMPLATE.items():
        league_subpages[league_name] = {category: url.format(season=season) for category, url in subpages.items()}
    return league_subpages

def scrape_all_leagues(league_subpages):
    all_data = pd.DataFrame()

    for league_name, league_urls in league_subpages.items():
        league_data = scrape_league_stats(league_name, league_urls)
        all_data = pd.concat([all_data, league_data], ignore_index=True)

    return all_data

# Main execution
if __name__ == "__main__":
    # Specify the season you want to scrape
    season = '2022-2023'
    
    # Generate the URLs for the specified season
    league_subpages = generate_league_subpages_for_season(season)
    
    # Scrape data sequentially for all leagues
    all_leagues_data = scrape_all_leagues(league_subpages)
    
    # Save to a CSV file
    output_filename = f'top_5_european_leagues_player_stats_{season}.csv'
    all_leagues_data.to_csv(output_filename, index=False)

    print(f"Scraping completed. Data saved to '{output_filename}'")


import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By

# Define the URLs for the top 5 European leagues
LEAGUES = {
    'Premier League': 'https://fbref.com/en/comps/9/stats/Premier-League-Stats',
    'La Liga': 'https://fbref.com/en/comps/12/stats/La-Liga-Stats',
    'Serie A': 'https://fbref.com/en/comps/11/stats/Serie-A-Stats',
    'Bundesliga': 'https://fbref.com/en/comps/20/stats/Bundesliga-Stats',
    'Ligue 1': 'https://fbref.com/en/comps/13/stats/Ligue-1-Stats'
}

def scrape_league_stats_selenium(league_name, league_url, driver):
    driver.get(league_url)
    time.sleep(5)  # Wait for the page to fully load

    # Locate the table using its ID
    table = driver.find_element(By.ID, 'stats_standard')

    # Extract header rows
    header_rows = table.find_elements(By.TAG_NAME, 'thead')[0].find_elements(By.TAG_NAME, 'tr')
    header_1 = [th.text for th in header_rows[0].find_elements(By.TAG_NAME, 'th')]  # First header row
    header_2 = [th.text for th in header_rows[1].find_elements(By.TAG_NAME, 'th')]  # Second header row

    # Flatten the headers based on the provided structure
    flattened_headers = []
    # Determine which columns are grouped under categories
    for i, (h1, h2) in enumerate(zip(header_1, header_2)):
        if h1:  # If the first header row has a category name (e.g., "Playing Time", "Performance")
            flattened_headers.append(f"{h1}_{h2}")
        else:  # If the first header row is empty, just use the second row (e.g., for "Player", "Nation", etc.)
            flattened_headers.append(h2)

    print(f"Flattened Headers for {league_name}: {flattened_headers}")  # Debugging: Print flattened headers

    # Extract rows of data
    rows = table.find_elements(By.TAG_NAME, 'tr')
    data = []
    for row in rows[1:]:  # Skip the header row(s)
        row_data = [td.text for td in row.find_elements(By.TAG_NAME, 'td')]
        if row_data:  # Skip empty rows
            data.append(row_data)

    # Create DataFrame
    try:
        df = pd.DataFrame(data, columns=flattened_headers)  # Use flattened headers
    except ValueError as e:
        print(f"Error creating DataFrame: {e}")
        return pd.DataFrame()  # Return an empty DataFrame in case of an error

    df['League'] = league_name  # Add a column for the league name

    return df

def scrape_all_leagues_selenium(league_urls):
    all_data = pd.DataFrame()

    # Initialize the Selenium WebDriver
    driver = webdriver.Chrome()

    for league_name, league_url in league_urls.items():
        print(f"Scraping data for {league_name}...")
        league_df = scrape_league_stats_selenium(league_name, league_url, driver)
        all_data = pd.concat([all_data, league_df], ignore_index=True)

    driver.quit()  # Close the browser
    return all_data

# Main execution
if __name__ == "__main__":
    all_leagues_data = scrape_all_leagues_selenium(LEAGUES)
    
    # Save to a CSV file
    all_leagues_data.to_csv('top_5_european_leagues_player_stats.csv', index=False)

    print("Scraping completed. Data saved to 'top_5_european_leagues_player_stats.csv'")

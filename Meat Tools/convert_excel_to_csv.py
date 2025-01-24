import pandas as pd

# Load the Excel file
excel_file = 'CSV/Input Example.xlsx'

# Read the Excel file
xls = pd.ExcelFile(excel_file)

# Iterate over each sheet and save as a CSV file
for sheet_name in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet_name)
    csv_file = f'CSV/{sheet_name}.csv'
    df.to_csv(csv_file, index=False)
    print(f'Saved {sheet_name} to {csv_file}')


import pandas as pd
import re
import sys
import os

def normalize_id(art_id):
    if pd.isna(art_id):
        return art_id
    # Convert to string
    s_id = str(art_id).strip()
    
    # Extract number
    match = re.search(r'(\d+)', s_id)
    if match:
        num = int(match.group(1))
        return f"ART{num:03d}"
    return s_id

def main():
    file_path = "Dataset 1 for senario generation component - Updated.xlsx"
    
    try:
        # Load the excel file
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"Error loading Excel file: {e}", file=sys.stderr)
        return

    # Filter for ART1-ART10
    target_ids = set(range(1, 11))
    
    # List to hold filtered rows
    filtered_rows = []
    
    # Identify ID column (usually first one or "artifact_id")
    id_col = df.columns[0]
    
    for index, row in df.iterrows():
        raw_id = row[id_col]
        norm_id = normalize_id(raw_id)
        
        # Check if it matches our target (ART001 to ART010)
        match = re.search(r'ART(\d+)', norm_id)
        if match:
            num = int(match.group(1))
            if num in target_ids:
                # Update the ID in the row
                row[id_col] = norm_id
                
                # Clean up all string columns
                for col in df.columns:
                    if isinstance(row[col], str):
                        val = row[col]
                        val = val.replace('\r', '')
                        val = re.sub(r'\n{3,}', '\n\n', val)
                        val = "\n".join([line.strip() for line in val.split('\n')])
                        row[col] = val.strip()

                filtered_rows.append(row)
    
    if not filtered_rows:
        print("No matching rows found for ART1-ART10.", file=sys.stderr)
        return

    result_df = pd.DataFrame(filtered_rows)
    
    # Define expected columns in order (exactly as in the original CSV)
    expected_columns = [
        'artifact_id', 'Name', 'type/category', 'period', 'historical time range', 
        'origin', 'historical_background', 'purpose', 'cultural_significance', 
        'related_events', 'Pre_written examples (What-If Questions)', 'pre_written_answers'
    ]
    
    # Ensure only expected columns are outputted, and in the correct order
    final_df = result_df.reindex(columns=expected_columns)
    
    # Path to the final dataset
    output_file = os.path.join("dataset", "Dataset - Sheet1.csv")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    try:
        # Write mode 'w' to create/overwrite the complete file
        final_df.to_csv(output_file, mode='w', index=False, header=True, lineterminator='\n', encoding='utf-8')
        print(f"Successfully rebuilt {output_file} with {len(final_df)} rows and correct headers.")
    except Exception as e:
        print(f"Error writing to file: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()

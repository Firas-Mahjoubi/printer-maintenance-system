import pandas as pd
import requests
import os

# Create a sample Excel file with printer data
def create_test_excel():
    # Sample printer data
    printer_data = {
        'marque': ['HP', 'Canon', 'Epson', 'Brother'],
        'modele': ['LaserJet Pro 400', 'PIXMA TR4500', 'WorkForce Pro WF-3720', 'HL-L2340DW'],
        'numeroSerie': ['CN12345ABC', 'K12345XYZ', 'EP98765DEF', 'BR54321GHI'],
        'emplacement': ['Bureau 101', 'Salle de réunion A', 'Bureau 205', 'Accueil']
    }
    
    df = pd.DataFrame(printer_data)
    excel_file = 'test_printers.xlsx'
    df.to_excel(excel_file, index=False)
    print(f"Created test Excel file: {excel_file}")
    return excel_file

# Test the Excel import endpoint
def test_excel_import():
    # Your JWT token
    jwt_token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmcnNtYUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpZCI6MSwiZXhwIjoxNzM1MjMxMjI3fQ.lQ5xR9lCNQcnqZfQa7gDgOLjAzBzSjvyJ5kxm7XmJpU"
    
    # Create test Excel file
    excel_file = create_test_excel()
    
    # API endpoint
    url = "http://localhost:8081/api/Imprimante/import-excel"
    
    # Headers with JWT token
    headers = {
        'Authorization': f'Bearer {jwt_token}'
    }
    
    # Test with a sample contract ID (you may need to adjust this)
    contract_id = 1  # Adjust this to a valid contract ID in your system
    
    # Prepare the request
    with open(excel_file, 'rb') as f:
        files = {'file': f}
        data = {'contratId': contract_id}
        
        print(f"Testing Excel import endpoint...")
        print(f"URL: {url}")
        print(f"Contract ID: {contract_id}")
        print(f"File: {excel_file}")
        
        try:
            response = requests.post(url, files=files, data=data, headers=headers)
            
            print(f"\nResponse Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"Response Body: {response.text}")
            
            if response.status_code == 200:
                print("✅ Excel import successful!")
            else:
                print("❌ Excel import failed!")
                
        except Exception as e:
            print(f"❌ Error making request: {e}")
    
    # Clean up
    if os.path.exists(excel_file):
        os.remove(excel_file)
        print(f"Cleaned up test file: {excel_file}")

if __name__ == "__main__":
    test_excel_import()

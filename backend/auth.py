import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def get_sts_credentials(role_arn):
    """
    Exchanges Hub credentials for Spoke (Client) temporary STS tokens.
    """
    try:
        # 1. Initialize the STS client using Hub User credentials
        sts_client = boto3.client(
            'sts',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_DEFAULT_REGION')
        )

        # 2. Assume the Role in the Client Account using the role_arn parameter
        response = sts_client.assume_role(
            RoleArn=role_arn,
            RoleSessionName="CWPP_Dashboard_CrossAccount_Scan",
            DurationSeconds=3600  # Valid for 1 hour
        )

        # 3. Extract the temporary session credentials
        temp_creds = response['Credentials']

        # 4. Return formatted for Trivy environment injection
        return {
            "AWS_ACCESS_KEY_ID": temp_creds['AccessKeyId'],
            "AWS_SECRET_ACCESS_KEY": temp_creds['SecretAccessKey'],
            "AWS_SESSION_TOKEN": temp_creds['SessionToken'],
            "AWS_REGION": os.getenv('AWS_DEFAULT_REGION') or "us-east-1"
        }
        
    except Exception as e:
        print(f"Auth Error: Management User cannot assume Client Role {role_arn}. {e}")
        return None
    
# Add this to auth.py
def get_account_details(account_id):
    """Fetches the Account Name from AWS Organizations."""
    try:
        org_client = boto3.client(
            'organizations',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_DEFAULT_REGION')
        )
        response = org_client.describe_account(AccountId=account_id)
        return response['Account']['Name']
    except Exception:
        return "Unknown Account" # Fallback if Organizations access is restricted
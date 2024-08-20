# Use the official Python image from the Docker Hub
FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy the requirements.txt file to the working directory
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app directory to the working directory
COPY . .

# Expose the port Streamlit runs on
EXPOSE 8501

# Run Streamlit app
CMD ["streamlit", "run", "scouting_dashboard.py", "--server.port=8501", "--server.enableCORS=false"]
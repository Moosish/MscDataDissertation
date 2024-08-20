import pandas as pd
import streamlit as st
import plotly.graph_objects as go
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances
from sklearn.impute import SimpleImputer
from transformers import GPT2Tokenizer, GPT2LMHeadModel, Trainer, TrainingArguments

# Load the dataset
file_path = 'enhanced_scouting_data.csv'
data = pd.read_csv(file_path)

# Function to normalize the rankings to a 0-100 scale
def normalize_rank(rank, total):
    return (rank / total) * 100

# Calculate rankings for each relevant per 90 statistic within similar positions
position_groups = data.groupby('Position')

for position, group in position_groups:
    data.loc[group.index, 'Goals per 90 Rank'] = group['Goals per 90'].rank(pct=True)
    data.loc[group.index, 'Assists per 90 Rank'] = group['Assists per 90'].rank(pct=True)
    data.loc[group.index, 'Shots per 90 Rank'] = group['Shots per 90'].rank(pct=True)
    data.loc[group.index, 'Shots on Target per 90 Rank'] = group['Shots on Target per 90'].rank(pct=True)
    data.loc[group.index, 'Dribbles Completed per 90 Rank'] = group['Dribbles Completed per 90'].rank(pct=True)
    data.loc[group.index, 'Tackles Won per 90 Rank'] = group['Tackles Won per 90'].rank(pct=True)
    data.loc[group.index, 'Interceptions per 90 Rank'] = group['Interceptions per 90'].rank(pct=True)
    data.loc[group.index, 'Aerial Duels Won per 90 Rank'] = group['Aerial Duels Won per 90'].rank(pct=True)
    data.loc[group.index, 'Pass Completion % Rank'] = group['Pass Completion %'].rank(pct=True)

# Convert rankings to a 0-100 scale
rank_columns = [
    'Goals per 90 Rank', 'Assists per 90 Rank', 'Shots per 90 Rank', 'Shots on Target per 90 Rank',
    'Pass Completion % Rank', 'Dribbles Completed per 90 Rank', 'Tackles Won per 90 Rank',
    'Interceptions per 90 Rank', 'Aerial Duels Won per 90 Rank'
]

data[rank_columns] = data[rank_columns] * 100

# Impute missing values using the mean
imputer = SimpleImputer(strategy='mean')
data[rank_columns] = imputer.fit_transform(data[rank_columns])

# Preprocess the data for clustering
scaler = StandardScaler()
scaled_data = scaler.fit_transform(data[rank_columns])

# Apply K-means clustering
kmeans = KMeans(n_clusters=10, random_state=42)
data['Cluster'] = kmeans.fit_predict(scaled_data)


def find_similar_players_with_explanations(player_name, data, num_similar=5):
    player_data = data[data['Player'] == player_name]
    position = player_data['Position'].values[0]
    cluster = player_data['Cluster'].values[0]

    same_position_cluster = data[(data['Position'] == position) & (data['Cluster'] == cluster)]
    distances = pairwise_distances(player_data[rank_columns], same_position_cluster[rank_columns])

    same_position_cluster['Distance'] = distances.flatten()
    similar_players = same_position_cluster.nsmallest(num_similar + 1, 'Distance')
    similar_players = similar_players[similar_players['Player'] != player_name]

    explanations = []
    for player in similar_players['Player'].values:
        similarity_explanation = generate_similarity_explanation(player_name, player, data)
        explanations.append((player, similarity_explanation))

    return explanations


def generate_similarity_explanation(player1, player2, data):
    features = rank_columns
    explanations = []
    for feature in features:
        value1 = data[data['Player'] == player1][feature].values[0]
        value2 = data[data['Player'] == player2][feature].values[0]
        explanations.append(f"{feature}: {player1} has {value1:.2f}, {player2} has {value2:.2f}")
    return " | ".join(explanations)

# Load pre-trained model and tokenizer
model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

# Prepare a simple example dataset (this should be replaced with your actual dataset)
train_dataset = [
    {"input": "Explain the similarities between Player A and Player B based on the following data: ...", "output": "Player A and Player B are similar because ..."}
    # Add more examples here
]

# Define training arguments
training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=4,
    num_train_epochs=3,
    save_steps=10_000,
    save_total_limit=2,
)

# Initialize Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)

# Fine-tune the model
trainer.train()

# Function to get explanation from the fine-tuned LLM
def get_llm_explanation(player1, player2, data):
    input_text = f"Explain the similarities between {player1} and {player2} based on the following data: {generate_similarity_explanation(player1, player2, data)}"
    inputs = tokenizer.encode(input_text, return_tensors="pt")
    outputs = model.generate(inputs, max_length=150)
    explanation = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return explanation

# Streamlit app
st.title("Scouting Dashboard")

# Sidebar for player selection
st.sidebar.header("Player Selection")
selected_player = st.sidebar.selectbox("Select a Player", data['Player'].unique())

# Display player profile summary
st.header(f"Player Profile Summary: {selected_player}")
player_profile = data[data['Player'] == selected_player].iloc[0]
cols = st.columns(2)

with cols[0]:
    st.subheader("Personal Information")
    st.write(f"**Player**: {player_profile['Player']}")
    st.write(f"**Nation**: {player_profile['Nation']}")
    st.write(f"**Position**: {player_profile['Position']}")
    st.write(f"**Squad**: {player_profile['Squad']}")
    st.write(f"**Competition**: {player_profile['Competition']}")
    st.write(f"**Age**: {player_profile['Age']}")

with cols[1]:
    st.subheader("Playing Statistics")
    st.write(f"**Matches Played**: {player_profile['Matches Played']}")
    st.write(f"**Starts**: {player_profile['Starts']}")
    st.write(f"**Minutes Played**: {player_profile['Minutes Played']}")
    st.write(f"**Goals per 90 Rank**: {player_profile['Goals per 90 Rank']:.2f}")
    st.write(f"**Assists per 90 Rank**: {player_profile['Assists per 90 Rank']:.2f}")
    st.write(f"**Shots per 90 Rank**: {player_profile['Shots per 90 Rank']:.2f}")
    st.write(f"**Shots on Target per 90 Rank**: {player_profile['Shots on Target per 90 Rank']:.2f}")
    st.write(f"**Pass Completion % Rank**: {player_profile['Pass Completion % Rank']:.2f}")
    st.write(f"**Dribbles Completed per 90 Rank**: {player_profile['Dribbles Completed per 90 Rank']:.2f}")
    st.write(f"**Tackles Won per 90 Rank**: {player_profile['Tackles Won per 90 Rank']:.2f}")
    st.write(f"**Interceptions per 90 Rank**: {player_profile['Interceptions per 90 Rank']:.2f}")
    st.write(f"**Yellow Cards**: {player_profile['Yellow Cards']}")
    st.write(f"**Red Cards**: {player_profile['Red Cards']}")
    st.write(f"**Aerial Duels Won per 90 Rank**: {player_profile['Aerial Duels Won per 90 Rank']:.2f}")
    st.write(f"**Aerial Duels Lost**: {player_profile['Aerial Duels Lost']}")
    st.write(f"**Aerial Duels Won %**: {player_profile['Aerial Duels Won %']}")

# Radar chart for player statistics
st.subheader("Player Performance Radar Chart")

# Categories for the radar chart without the per 90 or rank suffix
categories = ['Goals', 'Assists', 'Shots', 'Shots on Target',
              'Pass Completion %', 'Dribbles Completed', 'Tackles Won',
                            'Interceptions', 'Aerial Duels Won']

# Radar chart values
values = [
    player_profile['Goals per 90 Rank'], player_profile['Assists per 90 Rank'], player_profile['Shots per 90 Rank'],
    player_profile['Shots on Target per 90 Rank'], player_profile['Pass Completion % Rank'],
    player_profile['Dribbles Completed per 90 Rank'], player_profile['Tackles Won per 90 Rank'],
    player_profile['Interceptions per 90 Rank'], player_profile['Aerial Duels Won per 90 Rank']
]

fig = go.Figure()

fig.add_trace(go.Scatterpolar(
      r=values,
      theta=categories,
      fill='toself',
      name=player_profile['Player']
))

fig.update_layout(
  polar=dict(
    radialaxis=dict(
      visible=False
    )),
  showlegend=False
)

st.plotly_chart(fig)

# Display similar players with explanations
st.subheader("Top 5 Most Similar Players with Explanations")
similar_players_with_explanations = find_similar_players_with_explanations(selected_player, data)
for player, explanation in similar_players_with_explanations:
    st.write(f"**{player}**: {explanation}")

# Additional Insights

# Player Comparison
st.subheader("Compare Players")
selected_players = st.multiselect("Select Players to Compare", data['Player'].unique())
if len(selected_players) > 1:
    comparison_data = data[data['Player'].isin(selected_players)][['Player'] + rank_columns]
    st.write(comparison_data.set_index('Player'))

# Team Contribution
st.subheader("Team Contribution")
team = player_profile['Squad']
team_data = data[data['Squad'] == team]
total_goals = team_data['Goals per 90 Rank'].sum()
player_contribution = player_profile['Goals per 90 Rank']
contribution_percentage = (player_contribution / total_goals) * 100 if total_goals > 0 else 0
st.write(f"{player_profile['Player']} contributes {contribution_percentage:.2f}% to {team}'s total goals.")

# Trend Analysis
st.subheader("Trend Analysis")
trend_metric = st.selectbox("Select Metric for Trend Analysis", ['Goals', 'Assists', 'Shots', 'Shots on Target',
                                                                 'Pass Completion %', 'Dribbles Completed',
                                                                 'Tackles Won', 'Interceptions', 'Aerial Duels Won'])

# Assuming we have a column 'Season' to show trend over different seasons
if 'Season' in data.columns:
    trend_data = data[data['Player'] == selected_player][['Season', f'{trend_metric} per 90 Rank']]
    st.line_chart(trend_data.set_index('Season'))

# Scatter Plots
st.subheader("Scatter Plot Analysis")
x_metric = st.selectbox("Select X-axis Metric", ['Goals', 'Assists', 'Shots', 'Shots on Target',
                                                 'Pass Completion %', 'Dribbles Completed',
                                                 'Tackles Won', 'Interceptions', 'Aerial Duels Won'])
y_metric = st.selectbox("Select Y-axis Metric", ['Goals', 'Assists', 'Shots', 'Shots on Target',
                                                 'Pass Completion %', 'Dribbles Completed',
                                                 'Tackles Won', 'Interceptions', 'Aerial Duels Won'], index=1)

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=data[f'{x_metric} per 90 Rank'],
    y=data[f'{y_metric} per 90 Rank'],
    mode='markers',
    text=data['Player']
))

fig.update_layout(
    xaxis_title=f'{x_metric} per 90 Rank',
    yaxis_title=f'{y_metric} per 90 Rank',
    title=f'{x_metric} vs {y_metric}'
)

st.plotly_chart(fig)

# Show raw data
st.subheader("Raw Data")
st.write(data)
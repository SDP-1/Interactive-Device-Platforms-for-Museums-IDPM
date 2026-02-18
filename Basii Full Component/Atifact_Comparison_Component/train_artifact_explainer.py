import json
from pathlib import Path
from transformers import T5ForConditionalGeneration, T5Tokenizer, Trainer, TrainingArguments
import torch

# 1. Load artifact metadata
data_path = Path('trained_model/artifact_metadata.json')
with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

artifacts = data['artifacts']

# 2. Prepare dataset: concatenate all fields as input, use a structured explanation as target
examples = []
for artifact in artifacts:
    input_text = f"Explain this artifact: {artifact['name']} | Category: {artifact['category']} | Origin: {artifact['origin']} | Era: {artifact['era']} | Materials: {artifact['materials']} | Function: {artifact['function']} | Symbolism: {artifact['symbolism']} | Notes: {artifact['notes']}"
    
    # Create structured explanation in the exact format requested
    target_text = f"""{artifact['name']}

Overview
This {artifact['category'].lower()} originates from {artifact['origin']} and dates to {artifact['era']}.

Materials and Craftsmanship
{artifact['materials']}

Function and Use
{artifact['function']}

Cultural Significance
{artifact['symbolism']}

Special Features
{artifact['notes']}

This artifact represents an important piece of cultural heritage, showcasing the craftsmanship, beliefs, and practices of its time and place."""
    
    examples.append((input_text, target_text))

# 3. Tokenization - Use t5-base (smaller, faster to download)
model_name = 't5-base'
print(f"Loading {model_name} model and tokenizer...")
tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)

class ArtifactDataset(torch.utils.data.Dataset):
    def __init__(self, examples, tokenizer, max_input_length=512, max_target_length=512):
        self.examples = examples
        self.tokenizer = tokenizer
        self.max_input_length = max_input_length
        self.max_target_length = max_target_length
    def __len__(self):
        return len(self.examples)
    def __getitem__(self, idx):
        input_text, target_text = self.examples[idx]
        input_enc = self.tokenizer(
            input_text, truncation=True, padding='max_length', max_length=self.max_input_length, return_tensors='pt'
        )
        target_enc = self.tokenizer(
            target_text, truncation=True, padding='max_length', max_length=self.max_target_length, return_tensors='pt'
        )
        return {
            'input_ids': input_enc['input_ids'].squeeze(),
            'attention_mask': input_enc['attention_mask'].squeeze(),
            'labels': target_enc['input_ids'].squeeze()
        }

dataset = ArtifactDataset(examples, tokenizer)

# 4. Model and training setup
print("Loading model...")
model = T5ForConditionalGeneration.from_pretrained(model_name)
print("Model loaded successfully!")

training_args = TrainingArguments(
    output_dir='./t5_artifact_explainer',
    num_train_epochs=30,
    per_device_train_batch_size=2,
    save_steps=10,
    save_total_limit=2,
    logging_steps=5,
    learning_rate=3e-5,
    report_to=[],
    remove_unused_columns=False,
    warmup_steps=10
)

print("Initializing trainer...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    processing_class=tokenizer
)

# 5. Train
print("Starting training...")
trainer.train()
print("Training completed!")

# 6. Save model
print("Saving model and tokenizer...")
tokenizer.save_pretrained('./t5_artifact_explainer')
model.save_pretrained('./t5_artifact_explainer')

print('Training complete. Model saved to ./t5_artifact_explainer')

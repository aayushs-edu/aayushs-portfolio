import torch
from torch import nn
from torch.utils.data import DataLoader


def train(model: nn.Module, data: DataLoader, epochs: int = 12):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(
        opt, max_lr=3e-4, total_steps=epochs * len(data)
    )
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
    history = []

    for epoch in range(epochs):
        model.train()
        running, seen = 0.0, 0
        for images, labels in data:
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            logits = model(images)
            loss = loss_fn(logits, labels)

            opt.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()

            running += loss.item() * images.size(0)
            seen += images.size(0)

        history.append(running / seen)
        print(f"epoch {epoch + 1:02d}  loss {history[-1]:.4f}")

    return history


@torch.no_grad()
def accuracy(model: nn.Module, data: DataLoader) -> float:
    model.eval()
    hits = total = 0
    for images, labels in data:
        preds = model(images).argmax(dim=1)
        hits += (preds == labels).sum().item()
        total += labels.numel()
    return hits / max(total, 1)

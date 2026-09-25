To promote an existing, ephemeral external IP address to a static external IP address using the
`gcloud` CLI, use the `gcloud compute addresses create` command while providing the actual IP address
via the `--addresses` flag.

```sh
gcloud compute addresses create ADDRESS_NAME \
    --addresses=EPHEMERAL_IP_ADDRESS \
    --region=REGION
```

Review `gcloud compute addresses create --help` for more information.

Command Flags Breakdown

- `ADDRESS_NAME`: A unique name you choose to identify this static IP address resource.  
- `--addresses=EPHEMERAL_IP_ADDRESS`: The actual external IP address currently assigned to your instance (e.g., 35.200.10.20).
- `--region=REGION`: The region where your instance and ephemeral IP are located (e.g., us-central1).

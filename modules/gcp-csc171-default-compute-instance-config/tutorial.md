---
title: Google Cloud — Default CSC 171 Compute Engine VM
---

> Instructions for using `gcloud` to setup a new Compute Engine VM with the correct settings.

Replace all values in [square brackets] with appropriate new values.

```sh
INSTANCE_NAME=[my-new-instance-name]
PROJECT=[my-gcp-project]
```

Either set the two environment variables above or replace them in the context below with real
values.  **NOTE**: there is a `$PROJECT` in the `--create-disk` option that is easy to miss.

```sh
gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT \
    --zone=us-central1-a \
    --machine-type=e2-micro \
    --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
    --create-disk=auto-delete=yes,boot=yes,device-name=csc171-default-compute-instance,disk-resource-policy=projects/$PROJECT/regions/us-central1/resourcePolicies/default-schedule-1,image=projects/debian-cloud/global/images/debian-13-trixie-v20260902,mode=rw,size=10,type=pd-balanced
```


# ars-futura-task
Task for devops position in Ars Futura

This repository contains a simple node.js application, an Ansible playbook used for server setup and a Github Actions workflow used for deployment.

# The application
The application connects to a PostgreSQL database which is used for data storage. On startup, the application will run database migrations if necessary. The migration script creates the used table and fills it with dummy data.

The application has a single HTTP endpoint: `/users/all`. The endpoint simply serves the data created in the migration in a json format.

# Architecture
The application is running on the server using NPM, listening on a local port 3000. The NPM process is managed by PM2, which also provides environment configuration to the application using environment variables. The application is not directly accessible from outside the server.

The PostgreSQL database is running as a service on the host, listening on port 5432. It is managed by Ansible and not accessible from outside the server.

For application access from outside, an Nginx reverse proxy is set up. The proxy listens on ports 80 and 443 on the server, which are exposed to the outside network. On port 80, used for insecure HTTP communication, Nginx redirects traffic to a secure endpoint on port 443. Nginx handles SSL termination and forwards unencrypted http requests to the application itself. Nginx also handles http basic authorization, using user data from htpasswd file on disk.

The certificate generation is delegated to the Let's Encrypt service. Certbot is used to obtain a certificate during the server setup. When obtaining the certificate, certbot also configures Nginx to use it for serving requests.

In order to secure the server, a UFW firewall is set up, allowing incoming connections only on ports 22(ssh), 80(http) and 443(https). Outgoing connections are not limited. As an additional security measure, the ssh daemon is configured to only allow public keys for authorization, as well as denying logging in as root.

# Server setup
An Ansible playbook is used to configure the server. It installs the necessary packages, configures services and access, as well as setting up the preconditions required for the Github Actions workflow to work. In order to prevent restarting services multiple times during the playbook run while changing configuration, handlers are used. The setup is broken apart in several important files and directories:
1. playbook.yml - a list of tasks that should be done, and the order in which they are performed
2. vars.yml - non-sensitive configuration variables used in the playbook
3. vault.yml - sensitive configuration variables used in the playbook, kept in an encrypted format
4. inventory.ini - server configuration, containing its IP address and the location of the private key used for server access
5. files directory - contains configuration files and templates used for server setup

The precondition for running this playbook, due to the ssh daemon configuration, is to have a non-root user on the machine for which the password is known, and a private key authorized for login to the account. The key can be authorized by using the `ssh-copy-id` command before the ssh daemon is configured.

The users created are listed in vars.yml, along with URLs to their public keys, which are used for allowing access. If the users don't already exist on the server, a default password is set on the account which is located in vault.yaml.

Users and their passwords which are added to the htpasswd file, used for accessing the application through the Nginx proxy, are located in vault.yaml.

Database user created in PostgreSQL for application needs, as well as the database name, are located in vault.yaml. The values are used for database setup, as well as to fill the configuration in PM2 configuration template file.

Some of the packages installed by Ansible might require additional explanation:
- snapd - used to install certbot the recommended way, according to certbot documentation
- python3-pip - used to install psycopg2 package
- psycopg2 - used for manipulating the PostgreSQL database by Ansible
- git - used for fetching the application code, since it is not packaged in any special way in the pipeline
- acl - used to bypass Ansible limitation when using `become` to switch from one unprivileged user to the other, which causes issues with temporary file access

# Github Actions
A Github Actions workflow is used to deploy a new version of the application whenever a change is pushed to the main branch. The workflow sets up the SSH connection to the host, stops the application, pulls and builds a new version and starts the application back up. In order for this to work, a passwordless SSH access is required, which is set up through Ansible.

As the configuration for accessing the server is sensitive, it is kept in encrypted secrets in Github. The secrets, containing the private key for ssh access, the username and server location, are only provided to the workflow in runtime.

# Running the playbook
When the preconditions are met, the playbook can be run using the following command:
```
ansible-playbook -i inventory.ini --private-key $PRIVATE_KEY_FILE -u $REMOTE_USER --ask-vault-pass --ask-become-pass playbook.yml
```

Private key and remote user parameters can be removed if they are modified in the inventory file. Become pass parameter can be removed if it is modified in the vault. The playbook will start by asking for the vault pass, become pass, and the private key passphrase, if necessary.

# Possible improvements
The application is run under the root user, which is not secure. If another user were set up to run the application, it would also allow to require passwords when running sudo commands on the server, due to sudo hopefully not being required for deploying updates.

Breaking up the Ansible playbook into several roles or collections would improve readability and code organization.

Shell module is used in several steps in the playbook, which is less than ideal. It would be better to use specific modules when possible.

Application code is pulled to the server using git and dependencies are then installed directly on the server. Packaging the application with its dependencies in some way, e.g. a docker image, would be cleaner and would cause less downtime during redeployment.

Creating a database dump before the application update, or periodically, would be a good idea.

Automating certificate renewal would be nice to implement in case of a long-lived application.

import { factories } from '@strapi/strapi'
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export default factories.createCoreController('api::organization.organization', ({ strapi }) => ({
  async generateFiles(ctx) {
    try {
      // Destructure organizations from the request body
      const { organizations } = ctx.request.body;

      // Define a temporary directory to store YAML files
      const tempDir = path.join(__dirname, '../../../temp-yaml-files');

      // Check if the temporary directory exists, if not, create it
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 1. Generate configtx.yaml
      const configtx = {
        Organizations: organizations.map((org) => ({
          Name: org.name,
          ID: `${org.mspID}`,
          MSPDir: `crypto-config/peerOrganizations/${org.domain}/msp`,
          Policies: {
            Readers: {
              Type: 'Signature',
              Rule: `OR('${org.mspID}.member')`
            },
            Writers: {
              Type: 'Signature',
              Rule: `OR('${org.mspID}.member')`
            },
            Admins: {
              Type: 'Signature',
              Rule: `OR('${org.mspID}.admin')`
            }
          }
        }))
      };

      const configtxFilePath = path.join(tempDir, 'configtx.yaml');
      fs.writeFileSync(configtxFilePath, yaml.dump(configtx));

      // 2. Generate docker-compose.yaml
      const services = {};
      organizations.forEach((org) => {
        const peerName = `peer0.${org.domain}`;
        services[peerName] = {
          container_name: peerName,
          image: 'hyperledger/fabric-peer',
          environment: [
            `CORE_PEER_ID=${peerName}`,
            `CORE_PEER_ADDRESS=${peerName}:7051`,
            `CORE_PEER_LOCALMSPID=${org.mspID}`,
            "CORE_PEER_TLS_ENABLED=true"
          ],
          volumes: [
            `./crypto-config/peerOrganizations/${org.domain}/peers/peer0.${org.domain}/msp:/var/hyperledger/peer/msp`,
            `./crypto-config/peerOrganizations/${org.domain}/peers/peer0.${org.domain}/tls:/var/hyperledger/peer/tls`
          ],
          ports: [
            "7051:7051"
          ],
          networks: ['byfn']
        };
      });

      const dockerComposeFilePath = path.join(tempDir, 'docker-compose.yaml');
      fs.writeFileSync(dockerComposeFilePath, yaml.dump({ services }));

      // 3. Generate crypto-config.yaml
      const cryptoConfig = {
        PeerOrgs: organizations.map((org) => ({
          Name: org.name,
          Domain: org.domain,
          Template: {
            Count: 1
          },
          Users: {
            Count: 1
          }
        }))
      };

      const cryptoConfigFilePath = path.join(tempDir, 'crypto-config.yaml');
      fs.writeFileSync(cryptoConfigFilePath, yaml.dump(cryptoConfig));

      // Create a ZIP file containing the YAML files
      const zipFilePath = path.join(tempDir, 'generated-files.zip');
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Handle errors during archiving
      output.on('close', () => {
        console.log(`${archive.pointer()} total bytes`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      // Add YAML files to the archive
      archive.file(configtxFilePath, { name: 'configtx.yaml' });
      archive.file(dockerComposeFilePath, { name: 'docker-compose.yaml' });
      archive.file(cryptoConfigFilePath, { name: 'crypto-config.yaml' });

      // Finalize the archive
      await archive.finalize();

      // Send the ZIP file for download
      ctx.attachment('generated-files.zip');
      ctx.body = fs.createReadStream(zipFilePath);
      ctx.type = 'application/zip';

    } catch (error) {
      // Handle any errors during the process
      ctx.throw(500, error.message);
    }
  }
}));
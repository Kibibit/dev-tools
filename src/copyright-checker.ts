import { join } from 'path';

import { readdirSync, readFileSync, readJsonSync, writeFileSync } from 'fs-extra';
import checker from 'license-checker';
import { chain, isArray } from 'lodash';
import { Align, getMarkdownTable } from 'markdown-table-ts';
import axios from 'axios';
import { Octokit } from '@octokit/rest';

const file = './dep-licenses';

interface ILicense {
  name: string;
  path: string;
  repository: string;
  homepage: string;
  description: string;
  directDep: boolean;
  licenses: string;
  licenseShield: string;
  nameShield: string;
  logoShield: string;
  logo: string;
  fromGitHub: any;
}

export class CopyrightChecker {
  licenses: ILicense[] | Record<string, ILicense[]>;
  currentPackageData: Record<string, any>;
  onlyDirect: boolean;
  checkDependencyCopyrights(
    cwd: string,
    onlyDirect: boolean = false,
    group: boolean = false,
    type: 'markdown' | 'plain' = 'markdown'
  ) {
    this.currentPackageData = readJsonSync(join(cwd, 'package.json'));
    this.onlyDirect = onlyDirect;
    checker.init(
      {
        start: cwd,
        production: true
      },
      async (err, json) => {
        if (err) {
          console.log(err); //Handle error
        } else {
          this.licenses = chain(json)
            .mapValues((value: ILicense, key) => ({
              name: key,
              ...value
            }))
            .values()
            .value() as any as ILicense[];


          await Promise.all(this.licenses.map(async (value: ILicense) => {
            await this.getPackageExtraData(value);
            return value;
          }));

          this.licenses = chain(this.licenses)
            .filter((license: any) =>
              !(license as ILicense).name.includes(this.currentPackageData.name)
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .value() as any as ILicense[];

          this.licenses = group ?
            chain(this.licenses)
              .groupBy('licenses')
              .value() :
            this.licenses;

          writeFileSync(
            `${file}.${type === 'markdown' ? 'md' : 'txt'}`,
            type === 'markdown' ?
              this.printLicenseSummary() :
              this.printLicenseSummaryPlain()
          );
        }
      }
    );
  }

  printLicenseSummaryPlain() {
    return chain(isArray(this.licenses) ? [this.licenses] : this.licenses)
    .map((modules: ILicense[], key) => {
      const parsedModules = modules
        // sort order:
        //  - direct dependencies first
        //  - then if they have logo
        //  - then alphabetically
        .sort((a, b) => {
          if (a.directDep && !b.directDep) {
            return -1;
          }
          if (!a.directDep && b.directDep) {
            return 1;
          }
          // if (a.logo && !b.logo) {
          //   return -1;
          // }
          // if (!a.logo && b.logo) {
          //   return 1;
          // }
          return a.name.localeCompare(b.name);
        })
        .filter((module: ILicense) => !this.onlyDirect || module.directDep)
        .map((module) => [
          module.name
        ].join('\n'));

      return parsedModules.length ?
      [
        ...(typeof key === 'string' ? [
          '\n-------------------',
          `${key} - License Summary`,
          '-------------------\n'
        ] : []),
        ...parsedModules
      ].join('\n') : '';
    })
    .value()
    .join('\n\n');

  }

  printLicenseSummary() {
    return chain(isArray(this.licenses) ? [this.licenses] : this.licenses)
      .map((modules: ILicense[], key) => {
        const parsedModules = modules
          // sort order:
          //  - direct dependencies first
          //  - then if they have logo
          //  - then alphabetically
          .sort((a, b) => {
            if (a.directDep && !b.directDep) {
              return -1;
            }
            if (!a.directDep && b.directDep) {
              return 1;
            }
            // if (a.logo && !b.logo) {
            //   return -1;
            // }
            // if (!a.logo && b.logo) {
            //   return 1;
            // }
            return a.name.localeCompare(b.name);
          })
          .filter((module: ILicense) => !this.onlyDirect || module.directDep)
          .map((module) => [
            module.logoShield,
            [`[![${module.name}](${module.nameShield})](${module.homepage})`,
            `![](${ module.licenseShield })`,
            module.description].join('<br>')
          ]);
        return parsedModules.length ?
          [
            ...(typeof key === 'string' ? [`# ${key} - License Summary\n`] : []),
            getMarkdownTable({
              table: {
                head: ['Packages'],
                body: parsedModules
              },
              alignment: [Align.Left, Align.Left]
            })
          ].join('\n') : '';
      })
      .value()
      .join('\n\n');
  }

  async getPackageExtraData(license: Partial<ILicense>): Promise<void> {
    const packageDetails = readJsonSync(join(license.path, 'package.json'));
    const filesInFolder = readdirSync(license.path);
    const readmeFilename = filesInFolder.find((file) => file.toLowerCase().includes('readme'));
    const readmeFile = readmeFilename ? readFileSync(join(license.path, readmeFilename), 'utf8') : '';
    license.homepage = packageDetails.homepage || license.repository;
    license.description = packageDetails.description;
    license.directDep = Object.keys(this.currentPackageData.dependencies).includes(packageDetails.name);
    license.licenseShield = this.shieldUrl('License', license.licenses);
    let nameSplit = license.name.split('@');
    if (nameSplit.length > 2) {
      // join all but last since that's the version number
      nameSplit = [
        nameSplit.slice(0, nameSplit.length - 1).join('@'),
        nameSplit[nameSplit.length - 1]
      ];
    }
    license.nameShield = this.shieldUrl(nameSplit[0], nameSplit[1], 'npm', 'CB3837');
    license.logo = await this.getPackageLogo(nameSplit[0], readmeFile);
    // remove everything before .com/ in repo url
    const repoFullName = license.repository
      .replace(/.*\.com\//g, '');
    const owner = repoFullName.split('/')[0];
    const repo = repoFullName.split('/')[1];
    // TODO: fix right limit later and add this back as an option
    // license.fromGitHub = await this.getPackageLicenseFromGitHub(owner, repo);
    // console.log(license.fromGitHub);
    license.logoShield = license.logo ?
      `<img src="${license.logo}" width="50" />` :
      '';
  }

  shieldUrl(label: string, message: string, logo?: string, color?: string): string {
    return [
      'https://img.shields.io/static/v1?',
      'label=', encodeURIComponent(label),
      '&message=', encodeURIComponent(message),
      // '&style=for-the-badge',
      ...(logo ? [`&logo=${ logo }`] : []),
      `&color=${ color || 'blue' }`
    ].join('');
  }

  async getPackageLogo(name: string, readmeFile: string): Promise<string> {
    const logoRegex = new RegExp(`https://.*${ name }.*logo\\.(png|jpg|svg)`, 'gi');
    const logoUrl = readmeFile.match(logoRegex)?.[0];
    if (logoUrl) {
      return logoUrl;
    }
    const url = [
      'https://simpleicons.org/icons/',
      name.replace(/@/g, '-'),
      '.svg'
    ].join('');

    // check icon exists
    try {
      const res = await axios.get(url);
      return url;
    }
    catch (e) {
      return null;
    }
  }

  async getPackageLicenseFromGitHub(
    owner: string,
    repo: string
  ) {
    const octokit = new Octokit();
    const license = await octokit.rest.licenses.getForRepo({
      owner,
      repo
    });

    return {
      ...license.data,
      content: Buffer
        .from(license.data.content, 'base64')
        .toString('ascii')
    };
  }
}

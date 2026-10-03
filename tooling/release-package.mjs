import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const releasePackagePaths=[
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'adoption',
  'core',
  'release/RELEASE.md',
  'release/RELEASE-NOTES-0.2.0.md',
  'template',
  'tooling/build.mjs',
  'tooling/check',
  'tooling/context',
  'tooling/init',
  'tooling/preflight'
];

export async function createReleaseStaging(root,staging){
  await rm(staging,{recursive:true,force:true});
  await mkdir(staging,{recursive:true});

  for(const path of releasePackagePaths){
    const source=join(root,path);
    const target=join(staging,path);
    await mkdir(dirname(target),{recursive:true});
    await cp(source,target,{recursive:true});
  }

  const sourcePkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
  const releasePkg={
    name:sourcePkg.name,
    private:true,
    version:sourcePkg.version,
    type:sourcePkg.type,
    engines:sourcePkg.engines,
    scripts:{
      build:sourcePkg.scripts.build,
      'check:template':sourcePkg.scripts['check:template'],
      preflight:sourcePkg.scripts.preflight,
      context:sourcePkg.scripts.context
    },
    dependencies:sourcePkg.dependencies,
    devDependencies:sourcePkg.devDependencies
  };
  await writeFile(join(staging,'package.json'),JSON.stringify(releasePkg,null,2)+'\n');
  return releasePkg;
}

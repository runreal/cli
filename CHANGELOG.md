# Changelog

## [1.9.0](https://github.com/runreal/cli/compare/v1.8.0...v1.9.0) (2025-06-02)


### Bug Fixes

* removed msbuild specific target string ([#84](https://github.com/runreal/cli/issues/84)) ([2562957](https://github.com/runreal/cli/commit/25629573037e7961f9a97734a512da4610d5be5f))


### Miscellaneous Chores

* release 1.9.0 ([d6db301](https://github.com/runreal/cli/commit/d6db30130294d286f18e31536b7dfb2e9ab591a3))

## [1.8.0](https://github.com/runreal/cli/compare/v1.7.0...v1.8.0) (2025-05-23)


### Features

* conditional steps in workflow configs ([#82](https://github.com/runreal/cli/issues/82)) ([9054bc8](https://github.com/runreal/cli/commit/9054bc8d5ffbe237f024096adfd5d3302e0d4e48))
* new commands for local dev ([#80](https://github.com/runreal/cli/issues/80)) ([a448cfa](https://github.com/runreal/cli/commit/a448cfa6ad1e999cbad514a839fe52f5915bb80e))
* plugin utils ([6c689df](https://github.com/runreal/cli/commit/6c689dfcfe69f3215cc9a759fa6d8bfd135d3005))

## [1.7.0](https://github.com/runreal/cli/compare/v1.6.0...v1.7.0) (2025-05-09)


### Features

* new editor and project commands ([#66](https://github.com/runreal/cli/issues/66)) ([0e97f69](https://github.com/runreal/cli/commit/0e97f695e6da36cabe800d030170d8e349588880))


### Bug Fixes

* script runner os + compiled build fixes ([#73](https://github.com/runreal/cli/issues/73)) ([0ea35ab](https://github.com/runreal/cli/commit/0ea35abe28ee41ccb70f0f8b2600bfb778f635dc))
* update version ([e6a5cdd](https://github.com/runreal/cli/commit/e6a5cddd977bce9cc424a70acb6e57b95a68434a))

## [1.6.0](https://github.com/runreal/cli/compare/v1.5.0...v1.6.0) (2025-05-04)


### Features

* add list-targets cmd ([bc61ba9](https://github.com/runreal/cli/commit/bc61ba9fbb8a2d9c33525ac97b8dc87d88bf25b3))
* add runreal auth ([#54](https://github.com/runreal/cli/issues/54)) ([449eca8](https://github.com/runreal/cli/commit/449eca8d5f9ce30914e173ea6305cb45fba5bdcb))


### Bug Fixes

* add game profile to pkg ([59fa15a](https://github.com/runreal/cli/commit/59fa15ab2c465124dc70ff4d9d9d266e32a9d432))
* TargetInfo path resoluton ([7e94ccc](https://github.com/runreal/cli/commit/7e94cccc60f80df2ebf854eeb5a98409c4c61e06))

## [1.5.0](https://github.com/runreal/cli/compare/v1.4.1...v1.5.0) (2025-04-11)


### Features

* generate a markdown report with buildgraph errors ([#56](https://github.com/runreal/cli/issues/56)) ([6e10941](https://github.com/runreal/cli/commit/6e109418451c426b09892a9b2a8f4462499ae6b0))
* uasset utils and runpython helper ([#53](https://github.com/runreal/cli/issues/53)) ([8860b78](https://github.com/runreal/cli/commit/8860b78726372ad401d0107cebd7e0ea889f195a))
* update deno version ([#51](https://github.com/runreal/cli/issues/51)) ([5b1a952](https://github.com/runreal/cli/commit/5b1a9524de17b9ae5c21a9feb6dd2d633f4a4c04))


### Bug Fixes

* default val workaround, fix tests ([f42cc90](https://github.com/runreal/cli/commit/f42cc9083531e5ae2d970315eb579b9f25e67a9d))
* git engine update ([#55](https://github.com/runreal/cli/issues/55)) ([ee5a886](https://github.com/runreal/cli/commit/ee5a886f14653d8267a27187e242f03bdf14ddfb))

## [1.4.1](https://github.com/runreal/cli/compare/v1.4.0...v1.4.1) (2025-02-21)


### Bug Fixes

* allow specifying build timestamp ([7bee7aa](https://github.com/runreal/cli/commit/7bee7aae4731888eca809e43b1d5d849d04b71a2))
* race condition in buildId cfg ([75ce663](https://github.com/runreal/cli/commit/75ce663818acb4aec5d2679919426811112b2d0f))

## [1.4.0](https://github.com/runreal/cli/compare/v1.3.0...v1.4.0) (2024-11-28)


### Features

* [RUN-130] Update to Deno 2 ([#39](https://github.com/runreal/cli/issues/39)) ([a4930f7](https://github.com/runreal/cli/commit/a4930f76cdf0effcf2b8441112fc347197bc5631))
* [RUN-131] add workflow ID support ([#40](https://github.com/runreal/cli/issues/40)) ([0978ce1](https://github.com/runreal/cli/commit/0978ce10ef923e58a1a4d5052628dcbc4f289c76))
* config improvment ([#47](https://github.com/runreal/cli/issues/47)) ([ffc487f](https://github.com/runreal/cli/commit/ffc487f05cb2ca48a07b60a19744c400a779bb9b))
* script runner ([#42](https://github.com/runreal/cli/issues/42)) ([74ca3ab](https://github.com/runreal/cli/commit/74ca3ab868dd1af36aafdc381db0a92735aa0a3f))


### Bug Fixes

* [RUN-84] Error code when running command  ([#41](https://github.com/runreal/cli/issues/41)) ([b26b808](https://github.com/runreal/cli/commit/b26b80856c1a0b7db1392794a6327813bba9ae55))
* use draft 07 schema ([#38](https://github.com/runreal/cli/issues/38)) ([e6c87be](https://github.com/runreal/cli/commit/e6c87beb7858fadb4f46036e3cf80238032c74e3))

## [1.3.0](https://github.com/runreal/cli/compare/v1.2.3...v1.3.0) (2024-05-28)


### Features

* add date metadata to schema and template ([506390f](https://github.com/runreal/cli/commit/506390f9e5e7d63db54980b596583867ae8e0348))

## [1.2.3](https://github.com/runreal/cli/compare/v1.2.2...v1.2.3) (2024-05-08)


### Bug Fixes

* simplify p4 build id ([ed6cbd6](https://github.com/runreal/cli/commit/ed6cbd6b3b12e0215ff7a0c390389be24eff0510))

## [1.2.2](https://github.com/runreal/cli/compare/v1.2.1...v1.2.2) (2024-05-08)


### Bug Fixes

* remove param in constructor ([f058999](https://github.com/runreal/cli/commit/f058999ac37d197523dcad877530d6577db8dae3))

## [1.2.1](https://github.com/runreal/cli/compare/v1.2.0...v1.2.1) (2024-05-08)


### Bug Fixes

* p4 incorrect cl ref for current workspace ([30928bb](https://github.com/runreal/cli/commit/30928bbd840a6b457fc2a43ec1850454baccda58))

## [1.2.0](https://github.com/runreal/cli/compare/v1.1.2...v1.2.0) (2024-04-17)


### Features

* add $path interpolation ([#26](https://github.com/runreal/cli/issues/26)) ([dc59353](https://github.com/runreal/cli/commit/dc59353c5f5313c2fb963e359fe072e97ef010b5))
* improved p4 support and config templating ([#20](https://github.com/runreal/cli/issues/20)) ([b441d58](https://github.com/runreal/cli/commit/b441d5893543dc2c9e4b378de8d74d537b6735df))
* updated config with build metadata ([#22](https://github.com/runreal/cli/issues/22)) ([c7ce976](https://github.com/runreal/cli/commit/c7ce976cd15cdb6615bd191f5e1ffb41a6ad6330))
* use es6 templates for substitutions ([#8](https://github.com/runreal/cli/issues/8)) ([67972a9](https://github.com/runreal/cli/commit/67972a9fba47d0d07f36d5b9db7d98c775d086d6))


### Bug Fixes

* ref including leading and double slashes ([d5e6001](https://github.com/runreal/cli/commit/d5e6001bf9a2856603dce481ae52def3aa79f410))
* remove debug console.logs ([ac20f26](https://github.com/runreal/cli/commit/ac20f26b8c901bf5d9ec9935ee50622ecb3e0818))
* remove import map, deno install workaround ([7da65b0](https://github.com/runreal/cli/commit/7da65b09c271134bc8700cc6a97accccbe41be1e))
* revert engine instlal / update to previous version ([47a4b3b](https://github.com/runreal/cli/commit/47a4b3bda02cf25a62f65182b305c5276c2c3a39))
* templating in workflow exec ([56bcf05](https://github.com/runreal/cli/commit/56bcf05ca5a02e8fac100a6806337d484426df15))

## [1.1.2](https://github.com/runreal/cli/compare/v1.1.1...v1.1.2) (2024-04-08)


### Bug Fixes

* add workflows to schema ([7429e12](https://github.com/runreal/cli/commit/7429e12d739f2c94fdfec550d97beb9fc79d5943))

## [1.1.1](https://github.com/runreal/cli/compare/v1.1.0...v1.1.1) (2024-04-05)


### Bug Fixes

* default required values for config.git ([#9](https://github.com/runreal/cli/issues/9)) ([2c1e080](https://github.com/runreal/cli/commit/2c1e0803d903831a3ccc99d084b103cab14a6ff5))

## [1.1.0](https://github.com/runreal/cli/compare/v1.0.0...v1.1.0) (2024-04-04)


### Features

* add json-schema generation ([#5](https://github.com/runreal/cli/issues/5)) ([33f8838](https://github.com/runreal/cli/commit/33f8838f32a306915b6155f252c8b3f576d640f0))
* add zod schema + linux/macos engine support ([7101171](https://github.com/runreal/cli/commit/71011717a791ba2d7d67d6adb9ac01e500416b14))

## 1.0.0 (2024-03-16)


### Features

* init cli ([367a01f](https://github.com/runreal/cli/commit/367a01fb2cbd0e96872db9f10c2dcdb60c137df3))

## Changelog

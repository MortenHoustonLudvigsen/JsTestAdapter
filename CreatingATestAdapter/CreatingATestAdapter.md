---
layout: page
title: Creating a Visual Studio Test Explorer adapter with JS Test Adapter
permalink: /CreatingATestAdapter/
---

***This document is under construction!***

To demonstrate how this library is used I will implement a test adapter for [Jasmine](http://jasmine.github.io/) tests run in [Node.js](https://nodejs.org/).

## Prerequisites

Before creating a test adapter using JsTestAdapter the following should be installed:

* [Node.js](https://nodejs.org/)

* [Microsoft Visual Studio 2013 SDK](https://visualstudiogallery.msdn.microsoft.com/842766ba-1f32-40cf-8617-39365ebfc134)

* [Task Runner Explorer](https://visualstudiogallery.msdn.microsoft.com/8e1b4368-4afb-467a-bc13-9650572db708) - A task runner for Grunt and Gulp directly within Visual Studio 2013.

* [TypeScript 1.4 for Visual Studio 2013](https://visualstudiogallery.msdn.microsoft.com/2d42d8dc-e085-45eb-a30b-3f7d50d55304)

It might also be helpful to install:

* [Grunt CLI](http://gruntjs.com/using-the-cli)
  ````
  npm install -g grunt-cli
  ```` 

## Set up solution and project

Create a new "HTML Application with TypeScript" in Visual Studio 2013 called "JasmineNodeJsTestAdapter" (make sure to check `Create directory for solution`).

![](CreateSolution.png)

Once this is done, the solution explorer should look something like this:

![](SolutionAfterCreate.png)

Delete alle the files, that are added by default:

![](SolutionAfterDeleteDefaultFiles.png)

In the properties for the project make sure typescript files are compiled as "CommonJS" modules:

![](ConfigureTypescript.png)

Now the JsTestAdapter NuGet package is installed:

![](InstallJsTestAdapter.png)

Once JsTestAdapter is installed the solution should look something like this:

![](SolutionAfterInstallOfJsTestAdapter.png)

The Task Runner Explorer looks like (it might be necessary to run `nmp install` from a command prompt):

![](TaskRunnerExplorer1.png)

I can now build the solution, and double click the `CreatePackage` grunt task in the Task Runner Explorer. If I show all files in the Solution Explorer, I should see that a package `JasmineNodeJsTestAdapter.vsix` has been created:

![](SolutionAfterBuildAndCreatePackage.png)

To automate the creation of the package we bind the `CreatePackage` task to the `After Build` event in the Task Runner Explorer:

![](TaskRunnerExplorerAfterBind.png)

From now on the package `JasmineNodeJsTestAdapter.vsix` will be created after every build.

### package.json

A `package.json` file has been generated for us, and looks like:

````Json
{
  "name": "JasmineNodeJsTestAdapter",
  "version": "0.0.1",
  "private": true,
  "devDependencies": {
    "extend": "^2.0.0",
    "flatten-packages": "^0.1.4",
    "grunt": "^0.4.5",
    "grunt-contrib-clean": "^0.6.0",
    "grunt-contrib-compress": "^0.13.0",
    "grunt-contrib-copy": "^0.8.0",
    "grunt-exec": "^0.4.6",
    "grunt-nuget": "^0.1.4",
    "grunt-xmlpoke": "^0.8.0",
    "regedit": "^2.1.0",
    "semver": "^4.3.1",
    "string-template": "^0.2.0",
    "xmlbuilder": "^2.6.2",
    "zpad": "^0.5.0"
  },
  "dependencies": {
    "error-stack-parser": "^1.1.2",
    "iconv-lite": "^0.4.7",
    "q": "^1.2.0",
    "source-map": "^0.4.0",
    "source-map-resolve": "^0.3.1",
    "stackframe": "^0.2.2",
    "yargs": "^3.5.4"
  }
}
````

The version of the package `JasmineNodeJsTestAdapter.vsix` is generated from the `version` property in `package.json` when the `CreatePackage` task is run, so this is where the current version of the package is maintained.

### source.extension.vsixmanifest

A `source.extension.vsixmanifest` file has been generated for us, and looks like:

````xml
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Id="JasmineNodeJsTestAdapter.532799b3-f8c7-4e18-8571-b32faa93cf81" Version="x.x.x" Language="en-US" Publisher="" />
    <DisplayName>JasmineNodeJsTestAdapter</DisplayName>
    <Description xml:space="preserve">JasmineNodeJsTestAdapter</Description>
    <MoreInfo></MoreInfo>
    <License></License>
  </Metadata>
  <Installation>
    <InstallationTarget Version="[12.0,14.0]" Id="Microsoft.VisualStudio.Pro" />
    <InstallationTarget Version="[12.0,14.0]" Id="Microsoft.VisualStudio.Premium" />
    <InstallationTarget Version="[12.0,14.0]" Id="Microsoft.VisualStudio.Ultimate" />
  </Installation>
  <Dependencies>
    <Dependency Id="Microsoft.Framework.NDP" DisplayName="Microsoft .NET Framework" Version="[4.5,)" />
  </Dependencies>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.MefComponent" Path="JasmineNodeJsTestAdapter.dll" />
    <Asset Type="UnitTestExtension" Path="JasmineNodeJsTestAdapter.dll" />
  </Assets>
</PackageManifest>
````

I want to fill out `Publisher` attribute of the `Identity` element:

````xml
    <Identity Id="JasmineNodeJsTestAdapter.532799b3-f8c7-4e18-8571-b32faa93cf81" Version="x.x.x" Language="en-US" Publisher="Morten Houston Ludvigsen" />
````

Also, I want to fill out the `MoreInfo` and `License` elements:


````xml
    <MoreInfo>https://github.com/MortenHoustonLudvigsen/JasmineNodeJsTestAdapter</MoreInfo>
    <License>LICENSE</License>
````

Notice, that I don't change the `Version` attribute of the `Identity` element. This is handled by the `CreatePackage` grunt task.

### Gruntfile.js


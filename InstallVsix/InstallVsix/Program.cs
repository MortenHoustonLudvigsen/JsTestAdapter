using Microsoft.VisualStudio.ExtensionManager;
using Microsoft.VisualStudio.Settings;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InstallVsix
{
    public static class Program
    {
        static int Main(string[] args)
        {
            try
            {
                if (args.Length != 3)
                {
                    PrintUsage();
                    return 1;
                }

                var vsixFile = args[0];
                if (!File.Exists(vsixFile))
                {
                    Console.Error.WriteLine("VSIX file could not be found: {0}", vsixFile);
                    return 1;
                }

                var vsExecutable = args[1];
                if (!File.Exists(vsExecutable))
                {
                    Console.Error.WriteLine("Visual Studio executable file could not be found: {0}", vsExecutable);
                    return 1;
                }

                var rootSuffix = args[2];
                if (string.IsNullOrWhiteSpace(rootSuffix))
                {
                    Console.Error.WriteLine("RootSuffix must have a value");
                    return 1;
                }

                var vsix = ExtensionManagerService.CreateInstallableExtension(vsixFile);

                Console.WriteLine(
                    "Installing {0} version {1} to Visual Studio /RootSuffix {2}",
                    vsix.Header.Name, vsix.Header.Version, rootSuffix
                );

                using (var settingsManager = ExternalSettingsManager.CreateForApplication(vsExecutable, rootSuffix))
                {
                    var extensionManagerService = new ExtensionManagerService(settingsManager);
                    extensionManagerService.Install(vsix, perMachine: false);
                }

                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Error: {0}", ex.Message);
                return 1;
            }
        }

        private static void PrintUsage()
        {
            var name = typeof(Program).Assembly.GetName().Name;
            Console.Error.WriteLine(name);
            Console.Error.WriteLine("Installs local VSIX extensions to custom Visual Studio RootSuffixes");
            Console.Error.WriteLine();
            Console.Error.WriteLine("Usage:");
            Console.Error.WriteLine();
            Console.Error.WriteLine("  {0} <Path to VSIX> <Path to VS executable> <RootSuffix>", name);
        }
    }
}

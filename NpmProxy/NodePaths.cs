using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NpmProxy
{
    public static class NodePaths
    {
        private static readonly Lazy<string> _nodeJsPath = new Lazy<string>(() =>
            GetInstallPaths()
                .Select(p => Path.Combine(p, "node.exe"))
                .FirstOrDefault(p => File.Exists(p))
        );
        public static string NodeJsPath { get { return _nodeJsPath.Value; } }

        private static readonly Lazy<string> _npmJsPath = new Lazy<string>(() =>
            GetNpmPaths()
                .Select(p => Path.Combine(p, "npm.cmd"))
                .FirstOrDefault(p => File.Exists(p))
        );
        public static string NpmPath { get { return _npmJsPath.Value; } }

        public static IEnumerable<string> GetNpmPaths()
        {
            if (!string.IsNullOrWhiteSpace(NodeJsPath) && File.Exists(NodeJsPath))
            {
                yield return Path.GetDirectoryName(NodeJsPath);
            }
            foreach (var installPath in GetInstallPaths())
            {
                yield return installPath;
            }
        }

        public static IEnumerable<string> GetInstallPaths()
        {
            yield return GetInstallPathFromRegistry(RegistryHive.CurrentUser, RegistryView.Default);
            if (Environment.Is64BitOperatingSystem)
            {
                yield return GetInstallPathFromRegistry(RegistryHive.LocalMachine, RegistryView.Registry64);
            }
            yield return GetInstallPathFromRegistry(RegistryHive.LocalMachine, RegistryView.Registry32);
            foreach (var dir in Environment.GetEnvironmentVariable("PATH").Split(Path.PathSeparator))
            {
                yield return dir;
            }
            yield return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs");
            yield return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs");
        }

        private static string GetInstallPathFromRegistry(RegistryHive hive, RegistryView view)
        {
            return GetRegistryValue(RegistryHive.CurrentUser, RegistryView.Default, @"Software\Node.js", "InstallPath");
        }

        private static string GetRegistryValue(RegistryHive hive, RegistryView view, string path, string name)
        {
            using (var baseKey = RegistryKey.OpenBaseKey(hive, view))
            using (var node = baseKey.OpenSubKey(path))
            {
                if (node != null)
                {
                    return (node.GetValue(name) as string) ?? string.Empty;
                }
                return string.Empty;
            }
        }
    }
}

using JsTestAdapter.Helpers;
using JsTestAdapter.Logging;
using Microsoft.VisualStudio.Shell.Interop;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace JsTestAdapter.TestAdapter
{
    public class TestContainerList : IEnumerable<TestContainer>, IDisposable
    {
        public TestContainerList(TestContainerDiscoverer discoverer)
        {
            Discoverer = discoverer;
        }

        private List<TestContainer> _containers = new List<TestContainer>();
        public TestContainerDiscoverer Discoverer { get; private set; }

        public void CreateContainer(TestContainerSource source)
        {
            try
            {
                RemoveFromDirectory(source.SourceDirectory);
                if (!string.IsNullOrWhiteSpace(source.Source))
                {
                    _containers.Add(Discoverer.CreateTestContainer(source));
                }
                RemoveDuplicates();
                Discoverer.RefreshTestContainers();
            }
            catch (Exception ex)
            {
                Discoverer.Logger.Error(ex, "Failed to create test container for {0}", source.Source);
            }
        }

        public void CreateContainers(IEnumerable<TestContainerSource> sources)
        {
            foreach (var source in sources)
            {
                CreateContainer(source);
            }
        }

        public void RemoveDuplicates()
        {
            var containers = GetContainers();
            var containersToRemove = GetContainers(c => containers.Any(d => d.IsDuplicate(c)));

            foreach (var container in containersToRemove)
            {
                Remove(container);
            }
        }

        public void Remove(IVsProject project)
        {
            var containersToRemove = GetContainers(c => c.Project == project);
            foreach (var container in containersToRemove)
            {
                Remove(container);
            }
        }

        public void Remove(IEnumerable<string> source)
        {
            var containersToRemove = GetContainers(c => source.Any(s => PathUtils.PathsEqual(c.Source, s)));
            foreach (var container in containersToRemove)
            {
                Remove(container);
            }
        }

        public void Remove(string source)
        {
            var containersToRemove = GetContainers(c => PathUtils.PathsEqual(c.Source, source));
            foreach (var container in containersToRemove)
            {
                Remove(container);
            }
        }

        public void RemoveFromDirectory(string directory)
        {
            GetContainers(c => PathUtils.IsInDirectory(c.Source, directory)).ForEach(Remove);
        }

        public void Remove(TestContainer container)
        {
            if (_containers.Remove(container))
            {
                container.Dispose();
                Discoverer.RefreshTestContainers();
            }
        }

        public void Clear()
        {
            var containersToDispose = GetContainers();
            _containers.Clear();
            containersToDispose.ForEach(c => c.Dispose());
            Discoverer.RefreshTestContainers();
        }

        private List<TestContainer> GetContainers()
        {
            return new List<TestContainer>(_containers);
        }

        private List<TestContainer> GetContainers(Func<TestContainer, bool> predicate)
        {
            return new List<TestContainer>(_containers.Where(predicate));
        }

        public IEnumerator<TestContainer> GetEnumerator()
        {
            return _containers.GetEnumerator();
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public void Dispose()
        {
            Dispose(true);
            // Use SupressFinalize in case a subclass
            // of this type implements a finalizer.
            GC.SuppressFinalize(this);
        }

        // Flag: Has Dispose already been called? 
        private bool _disposed = false;

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
                return;

            if (disposing)
            {
                if (_containers != null)
                {
                    Clear();
                    _containers = null;
                }
            }
        }

        ~TestContainerList()
        {
            Dispose(false);
        }
    }
}
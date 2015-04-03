using System;
using System.Collections.Generic;
using System.Linq;
using System.Timers;
using System.Web;

namespace JsTestAdapter.Helpers
{
    public class Scheduler : Scheduler<object>
    {
        public Scheduler(int delay, Action action)
            : base(delay, c => action())
        {
        }
    }

    public class Scheduler<TContext> : IDisposable
    {
        public Scheduler(int delay, Action<IEnumerable<TContext>> action)
        {
            Delay = delay;
            _action = action;
        }

        private object _lock = new object();
        private Timer _timer;
        private List<TContext> _contexts = new List<TContext>();
        private Action<IEnumerable<TContext>> _action;

        public int Delay { get; set; }

        private void OnElapsed(object source, ElapsedEventArgs e)
        {
            lock (_lock)
            {
                Stop();
                _action(_contexts.ToArray());
                _contexts.Clear();
            }
        }

        public void Schedule(TContext context = default(TContext))
        {
            lock (_lock)
            {
                Stop();
                if (!object.Equals(context, default(TContext)))
                {
                    _contexts.Add(context);
                }
                _timer = new Timer(Delay) { AutoReset = false };
                _timer.Elapsed += OnElapsed;
                _timer.Start();
            }
        }

        public void Stop()
        {
            lock (_lock)
            {
                if (_timer != null)
                {
                    _timer.Dispose();
                    _timer = null;
                }
            }
        }

        #region IDisposable

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
            if (_disposed) return;
            _disposed = true;

            if (disposing)
            {
                Stop();
            }
        }

        ~Scheduler()
        {
            Dispose(false);
        }

        #endregion
    }
}
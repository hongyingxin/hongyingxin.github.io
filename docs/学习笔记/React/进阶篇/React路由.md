# React 实现类似于 Vue-router 提供的路由守卫

在 React 中，虽然没有像 Vue-router 这样内置的路由守卫功能，但我们可以通过组合 React Router 和一些自定义逻辑来实现类似于 Vue-router 提供的路由守卫功能。

## 使用 useEffect 钩子在组件层面实现

对于需要进行路由守卫的组件，可以在组件的 useEffect 中添加相应的导航逻辑。这种方式类似于 Vue 的 beforeRouterEnter 守卫。

```js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProtectedComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = checkAuthentication(); // 自定义的身份验证逻辑
    if (!isAuthenticated) {
      navigate('/login'); // 如果未登录，重定向到登录页面
    }
  }, [navigate]);

  return <div>Protected Content</div>;
}
```

## 使用高阶组件

通过高阶组件，可以将路由守卫的逻辑封装在组件外部，从而实现类似全局路由守卫的功能。

```js
import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';

const withAuthGuard = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    useEffect(() => {
      const isAuthenticated = checkAuthentication(); // 自定义的验证逻辑
      if (!isAuthenticated) {
        navigate('/login'); // 如果未通过验证，重定向
      }
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };
};

const ProtectedComponent = () => {
  return <div>Protected Content</div>;
};

export default withAuthGuard(ProtectedComponent);
```

## React Router Outlet 和中间件模式

React Router 提供了`<Outlet>`组件，它可以允许让我们将路由守卫逻辑应用到某些路由集合上。可以通过中间件模式对路由进行守卫。

```js
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isAuthenticated }) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// 使用：
<Route path="/protected" element={<ProtectedRoute isAuthenticated={authStatus} />}>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

## 在路由配置中实现路由守卫逻辑

可以通过在路由配置中直接实现身份验证或其他守卫逻辑

```js
import { Route, Routes, Navigate } from 'react-router-dom';

function PrivateRoute({ element: Component, isAuthenticated, ...rest }) {
  return (
    <Route
      {...rest}
      element={isAuthenticated ? <Component /> : <Navigate to="/login" />}
    />
  );
}

function App() {
  const isAuthenticated = checkAuthentication(); // 自定义验证逻辑

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <PrivateRoute path="/dashboard" element={<Dashboard />} isAuthenticated={isAuthenticated} />
    </Routes>
  );
}
```

## 使用 Redux 或 Context 实现全局守卫

结合 useContext 或 Redux，可以将身份验证状态存储在全局状态中，然后在每个需要守卫的组件或路由上进行判断。

Context方式：

```js
import { useContext, useEffect } from 'react';
import { AuthContext } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

function ProtectedComponent() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login'); // 重定向到登录页面
    }
  }, [isAuthenticated, navigate]);

  return <div>Protected Content</div>;
}
```

Redux方式：

```js
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function ProtectedComponent() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return <div>Protected Content</div>;
}
```
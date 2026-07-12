export default function Login() {
  const handleGoogleLogin = async (response) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: response.profileObj.email,
          name: response.profileObj.name,
          googleId: response.profileObj.googleId,
          picture: response.profileObj.imageUrl
        })
      });
      
      const data = await res.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">AssetFlow Login</h1>
        <button
          onClick={() => window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + import.meta.env.VITE_GOOGLE_CLIENT_ID + '&redirect_uri=' + window.location.origin + '/auth/callback&response_type=code&scope=openid%20email%20profile'}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    </section>
  );
}

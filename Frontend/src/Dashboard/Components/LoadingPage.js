import React from 'react';

const LoadingAnimation = () => {
  // CSS variables
  const vars = {
    duration: '1.5s',
    containerSize: '250px',
    boxSize: '33px',
    boxBorderRadius: '15%',
  };

  // Keyframe animations
  const keyframes = {
    slide: `
      @keyframes slide {
        0% { background-color: #09D1C7; transform: translatex(0vw); }
        100% { background-color: #80EE98; transform: translatex(calc(${vars.containerSize} - (${vars.boxSize} * 1.25))); }
      }
    `,
    colorChange: `
      @keyframes colorChange {
        0% { background-color: #09D1C7; }
        100% { background-color: #80EE98; }
      }
    `,
    ...Array.from({ length: 4 }, (_, i) => ({
      [`flip${i + 1}`]: `
        @keyframes flip${i + 1} {
          0%, ${(i + 1) * 15}% { transform: rotate(0); }  
          ${(i + 1) * 15 + 20}%, 100% { transform: rotate(-180deg); }
        }
      `,
      [`squidge${i + 1}`]: `
        @keyframes squidge${i + 1} {
          ${(i + 1) * 15 - 10}% { transform-origin: center bottom; transform: scalex(1) scaley(1);}
          ${(i + 1) * 15}% { transform-origin: center bottom; transform: scalex(1.3) scaley(0.7);}
          ${(i + 1) * 15 + 10}%, ${(i + 1) * 15 + 5}% { transform-origin: center bottom; transform: scalex(0.8) scaley(1.4);}
          ${(i + 1) * 15 + 40}%, 100% { transform-origin: center top; transform: scalex(1) scaley(1);}
          ${(i + 1) * 15 + 25}% { transform-origin: center top; transform: scalex(1.3) scaley(0.7);}
        }
      `,
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
  };

  // Styles
  const styles = {
    wrapper: {
      width: '100%',
      height: '90vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: vars.containerSize,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    },
    box: {
      width: vars.boxSize,
      height: vars.boxSize,
      position: 'relative',
      display: 'block',
      transformOrigin: '-50% center',
      borderRadius: vars.boxBorderRadius,
    },
    boxAfter: {
      content: "''",
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#09D1C7',
      borderRadius: vars.boxBorderRadius,
      boxShadow: '0px 0px 10px 0px rgba(9, 209, 199, 0.4)',
    },
  };

  // Generate box styles
  const boxStyles = Array.from({ length: 5 }, (_, i) => ({
    ...styles.box,
    animation: i === 0 ? `slide ${vars.duration} ease-in-out infinite alternate` : `flip${i} ${vars.duration} ease-in-out infinite alternate`,
    '&:after': {
      ...styles.boxAfter,
      animation: i === 0 ? `colorChange ${vars.duration} ease-in-out infinite alternate` : `squidge${i} ${vars.duration} ease-in-out infinite alternate`,
      backgroundColor: ['#09D1C7', '#1FB1FD', '#22C7FB', '#23D3FB', '#80EE98'][i],
    },
  }));

  return (
    <>
    <div className="fixed inset-0 z-0">
        <img
          src="/homebgc.jpg"
          alt="Background"
          className="w-full h-full object-cover mt-12"
        />
        <div className="absolute  inset-0 bg-black/70" />
      </div>
    <div style={styles.wrapper} className='backdrop-blur-sm'>
      <style>
        {Object.values(keyframes).join('\n')}
      </style>
      <div style={styles.container}>
        {boxStyles.map((style, index) => (
          <div key={index} style={style}>
            <div style={style['&:after']} />
          </div>
        ))}
      </div>
    </div>
        </>
  );
};

export default LoadingAnimation;


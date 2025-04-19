'use client'
import { useState } from 'react'
import { useEffect } from 'react'

export default function Mouselight() {

	const [mousePos, setMousePos] = useState([0, 0])

	useEffect(() => {
		let animationFrameId;
		let targetPos = mousePos;
		let currentPos = [...mousePos];

		const handleMouseMove = (e) => {
			targetPos = [e.pageX, e.pageY];
		};

		const animate = () => {
			// Lerp vers la position cible
			currentPos[0] += (targetPos[0] - currentPos[0]) * 0.1;
			currentPos[1] += (targetPos[1] - currentPos[1]) * 0.1;

			const circle = document.querySelector('.mouselight__circle');
			if (circle) {
				circle.style.left = `${currentPos[0] - circle.clientWidth / 2}px`;
				circle.style.top = `${currentPos[1] - circle.clientHeight / 2}px`;
			}
			animationFrameId = requestAnimationFrame(animate);
		};

		window.addEventListener('mousemove', handleMouseMove);
		animate();

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<div className='mouselight w-screen h-screen top-0 left-0 pointer-events-none z-50'>
			<div className='mouselight__circle w-72 h-72 rounded-full bg-primary opacity-30 blur-3xl absolute'></div>
		</div>
	)
}
